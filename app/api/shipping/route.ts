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
      // 04510 = PAC, 04014 = SEDEX
      const url = `http://ws.correios.com.br/calculador/CalcPrecoPrazo.aspx?nCdEmpresa=&sDsSenha=&sCepOrigem=${cepOrigem}&sCepDestino=${cleanCep}&nVlPeso=1&nCdFormato=1&nVlComprimento=20&nVlAltura=10&nVlLargura=20&sCdMaoPropria=n&nVlValorDeclarado=0&sCdAvisoRecebimento=n&nCdServico=${servico}&nVlDiametro=0`;
      
      const res = await fetch(url);
      const xml = await res.text();

      // Extrair Valor
      const valorMatch = xml.match(/<Valor>(.*?)<\/Valor>/);
      const prazoMatch = xml.match(/<PrazoEntrega>(.*?)<\/PrazoEntrega>/);
      const erroMatch = xml.match(/<MsgErro>(.*?)<\/MsgErro>/);

      const valorStr = valorMatch ? valorMatch[1] : '0,00';
      const prazoStr = prazoMatch ? prazoMatch[1] : '0';
      const erro = erroMatch ? erroMatch[1] : '';

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
      return NextResponse.json({ error: 'Correios: ' + pac.erro }, { status: 400 });
    }

    return NextResponse.json({
      pac: {
        price: pac.valor,
        days: pac.prazo
      },
      sedex: {
        price: sedex.valor,
        days: sedex.prazo
      }
    });

  } catch (error) {
    console.error('Correios Error:', error);
    return NextResponse.json({ error: 'Falha ao conectar com os Correios' }, { status: 500 });
  }
}
