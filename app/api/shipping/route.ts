import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cep = searchParams.get('cep');

  if (!cep) {
    return NextResponse.json({ error: 'CEP de destino é obrigatório' }, { status: 400 });
  }

  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) {
    return NextResponse.json({ error: 'CEP inválido' }, { status: 400 });
  }

  // CEP de Origem: Linhares - ES
  const cepOrigem = '29900000';

  try {
    const fetchCorreios = async (servico: string) => {
      const url = `http://ws.correios.com.br/calculador/CalcPrecoPrazo.aspx?nCdEmpresa=&sDsSenha=&sCepOrigem=${cepOrigem}&sCepDestino=${cleanCep}&nVlPeso=1&nCdFormato=1&nVlComprimento=20&nVlAltura=10&nVlLargura=20&sCdMaoPropria=n&nVlValorDeclarado=0&sCdAvisoRecebimento=n&nCdServico=${servico}&nVlDiametro=0`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      const xml = await res.text();
      const valorMatch = xml.match(/<Valor>(.*?)<\/Valor>/);
      const prazoMatch = xml.match(/<PrazoEntrega>(.*?)<\/PrazoEntrega>/);
      const erroMatch = xml.match(/<MsgErro>(.*?)<\/MsgErro>/);

      const valorStr = valorMatch ? valorMatch[1] : '0,00';
      const prazoStr = prazoMatch ? prazoMatch[1] : '0';
      const erro = erroMatch ? erroMatch[1] : '';

      if (parseFloat(valorStr.replace(',', '.')) === 0 && erro) {
        throw new Error(erro);
      }

      return {
        valor: parseFloat(valorStr.replace(',', '.')),
        prazo: parseInt(prazoStr, 10),
        erro: erro && erro.length > 5 ? erro : null
      };
    };

    const [pac, sedex] = await Promise.all([
      fetchCorreios('04510'),
      fetchCorreios('04014')
    ]);

    if (pac.erro && sedex.erro) {
      throw new Error('Correios retornou erro para ambos os serviços');
    }

    return NextResponse.json({
      pac: { price: pac.valor, days: pac.prazo },
      sedex: { price: sedex.valor, days: sedex.prazo }
    });

  } catch (error) {
    console.error('Correios Error, using fallback:', error);
    
    // Fallback based on region (ViaCEP)
    try {
      const viaCepRes = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const viaCepData = await viaCepRes.json();
      
      if (viaCepData.erro) throw new Error('CEP não encontrado');
      
      const uf = viaCepData.uf;
      let pacPrice = 35.50; let pacDays = 8;
      let sedexPrice = 75.90; let sedexDays = 4;

      if (uf === 'ES') {
        pacPrice = 18.50; pacDays = 3;
        sedexPrice = 24.90; sedexDays = 1;
      } else if (['SP', 'RJ', 'MG', 'BA'].includes(uf)) {
        pacPrice = 25.90; pacDays = 5;
        sedexPrice = 45.50; sedexDays = 2;
      } else if (['PR', 'SC', 'RS', 'GO', 'DF'].includes(uf)) {
        pacPrice = 32.00; pacDays = 6;
        sedexPrice = 55.00; sedexDays = 3;
      }

      return NextResponse.json({
        pac: { price: pacPrice, days: pacDays },
        sedex: { price: sedexPrice, days: sedexDays }
      });
    } catch (fallbackError) {
      return NextResponse.json({ error: 'CEP inválido ou indisponível' }, { status: 400 });
    }
  }
}
