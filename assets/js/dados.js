/* ==========================================================================
   DADOS DO SITE CBHTO
   Edite este arquivo para atualizar textos, contatos e comitês.
   Notícias e documentos ficam em noticias.js e documentos.js.
   ========================================================================== */

window.CONFIG = {
  nomeSite: 'CBHTO',
  nomeCompleto: 'Comitês de Bacias Hidrográficas do Tocantins',
  // Preencha os contatos oficiais antes de publicar. Campos vazios não aparecem no site.
  email: 'procomites@gmail.com',
  telefone: '',       // ex.: '(63) 0000-0000'
  whatsapp: '',       // só números com DDD e país, ex.: '5563999999999'
  endereco: '',       // ex.: 'IFTO – Reitoria, Palmas/TO'
  instagram: 'https://www.instagram.com/cbhdoto/',
  facebook: 'https://www.facebook.com/cbhtocantins',
  youtube: '',
  // Endereço do formulário de contato (Google Forms, Formspree etc.). Vazio = o formulário abre o e-mail.
  formularioAction: ''
};

window.COMITES = [
  {
    id: 'cbhlp',
    sigla: 'CBHLP',
    nome: 'Comitê da Bacia Hidrográfica do Lago de Palmas',
    curto: 'Lago de Palmas',
    cor: '#b4c831',
    banner: 'assets/img/banners/banner-lago-de-palmas.jpg',
    logo: 'assets/img/logos/recorte/cbhlp.png',
    mapa: 'assets/img/mapas/cbhlp.png',
    regiao: 'Região central',
    area: '17.760 km²',
    criacao: '22/03/2011',
    sede: 'Palmas',
    resumo: '24 municípios em torno do lago da UHE Luís Eduardo Magalhães (Lajeado).',
    texto: [
      'O CBHLP é o colegiado responsável pela gestão participativa das águas da bacia do entorno do lago da UHE Luís Eduardo Magalhães (Lajeado). Reúne poder público, usuários de água e sociedade civil para proteger os mananciais da região e orientar o uso sustentável da água.',
      'A mobilização começou ainda durante o enchimento do lago, quando estudos em Palmas, Aparecida do Rio Negro, Lajeado, Porto Nacional e Tocantínia avaliaram os impactos da represa. Em 2003 o Governo do Estado elaborou o diagnóstico das demandas hídricas do entorno de Palmas e, em 2004, formou-se um grupo de trabalho Pró-Comitê com 32 instituições.',
      'Com parecer favorável do Conselho Estadual de Recursos Hídricos, o comitê foi criado em 22 de março de 2011 pelo Decreto nº 4.434/2011, inicialmente como Comitê da Bacia Hidrográfica do Entorno do Lago (CBHEL).',
      'O comitê tem 34 membros entre titulares e suplentes, reúne-se em plenário quatro vezes por ano em reuniões abertas ao público e conta com as Câmaras Técnicas de Plano de Bacia, Outorga e Educação Ambiental.'
    ],
    municipios: ['Aliança do Tocantins','Barrolândia','Brejinho de Nazaré','Chapada da Natividade','Cristalândia','Crixás do Tocantins','Fátima','Gurupi','Ipueiras','Lajeado','Miracema do Tocantins','Monte do Carmo','Monte Santo do Tocantins','Nova Rosalândia','Oliveira de Fátima','Palmas','Paraíso do Tocantins','Pindorama do Tocantins','Pium','Porto Nacional','Pugmil','Santa Rita do Tocantins','Santa Rosa do Tocantins','Silvanópolis']
  },
  {
    id: 'cbhrf',
    sigla: 'CBHRF',
    nome: 'Comitê da Bacia Hidrográfica do Rio Formoso',
    curto: 'Rio Formoso',
    cor: '#4d88cd',
    banner: 'assets/img/banners/banner-rio-formoso.jpg',
    logo: 'assets/img/logos/recorte/cbhrf.png',
    mapa: 'assets/img/mapas/cbhrf.jpg',
    regiao: 'Sudoeste',
    area: '21.328 km²',
    criacao: '22/03/2011',
    sede: 'Lagoa da Confusão',
    resumo: 'Sudoeste do estado, uma das principais regiões de agricultura irrigada do Tocantins.',
    texto: [
      'O CBHRF reúne poder público, usuários de água e sociedade civil da bacia do Rio Formoso, uma das regiões de agricultura irrigada mais importantes do Tocantins. O comitê acompanha o uso da água, organiza o revezamento das captações nos períodos de estiagem e atua junto ao Judiciário, ao Ministério Público e ao Naturatins para prevenir crises hídricas.',
      'A articulação começou em Pium, em junho de 2010, com a instalação da Comissão Pró-Comitê. A criação do comitê foi publicada no Diário Oficial em 22 de março de 2011. Os primeiros membros foram eleitos e empossados em maio de 2012, e a primeira reunião ordinária, em junho de 2012 em Lagoa da Confusão, aprovou o regimento interno.',
      'A bacia fica no sudoeste do estado e drena cerca de 21.328 km², o equivalente a 7,7% do Tocantins e 5,6% da bacia do Araguaia. Divide-se em sub-bacias como as dos rios Escuro, Pau Seco, Taboca, Xavante, Dueré, Lago Verde e Urubu.'
    ],
    municipios: ['Aliança do Tocantins','Alvorada','Araguaçu','Cariri do Tocantins','Cristalândia','Crixás do Tocantins','Dueré','Fátima','Figueirópolis','Formoso do Araguaia','Gurupi','Lagoa da Confusão','Nova Rosalândia','Oliveira de Fátima','Pium','Sandolândia','Santa Rita do Tocantins','Talismã']
  },
  {
    id: 'cbhlc',
    sigla: 'CBHLC',
    nome: 'Comitê das Bacias Hidrográficas dos Rios Lontra e Corda',
    curto: 'Rios Lontra e Corda',
    cor: '#7676b3',
    banner: 'assets/img/banners/banner-lontra-e-corda.jpg',
    logo: 'assets/img/logos/recorte/cbhlc.png',
    mapa: 'assets/img/mapas/cbhlc.jpg',
    regiao: 'Norte',
    area: '7.354 km²',
    criacao: '',
    sede: 'Araguaína',
    resumo: 'Norte do estado, região de Araguaína, afluentes do baixo Araguaia.',
    texto: [
      'O CBHLC é o colegiado que cuida da gestão participativa das águas dos rios Lontra e Corda, no norte do Tocantins, região de Araguaína. Reúne poder público, usuários de água e sociedade civil dos 12 municípios da bacia.',
      'Os dois rios pertencem ao sistema do Araguaia e deságuam na margem direita dele, já no seu curso inferior. O Lontra nasce em Araguaína, percorre cerca de 200 km e drena 3.870 km² até chegar ao Araguaia entre Araguanã e Xambioá. O Corda nasce em Wanderlândia, percorre cerca de 135 km, drena 3.484 km² e marca a divisa entre Xambioá e Ananás.',
      'O Plano de Bacia dividiu a região em sub-bacias, que servem de base para os estudos de disponibilidade de água, demanda e balanço hídrico.'
    ],
    municipios: ['Ananás','Angico','Aragominas','Araguaína','Araguanã','Babaçulândia','Carmolândia','Darcinópolis','Piraquê','Riachinho','Wanderlândia','Xambioá']
  },
  {
    id: 'cbhrma',
    sigla: 'CBHRMA',
    nome: 'Comitê da Bacia Hidrográfica do Rio Manuel Alves',
    curto: 'Rio Manuel Alves',
    cor: '#759e73',
    banner: 'assets/img/banners/banner-manuel-alves.jpg',
    logo: 'assets/img/logos/recorte/cbhrma.png',
    mapa: 'assets/img/mapas/cbhrma.jpg',
    regiao: 'Sudeste',
    area: '14.894 km²',
    criacao: '',
    sede: 'Natividade',
    resumo: 'Sudeste do estado, bacia do Projeto de irrigação Manuel Alves.',
    texto: [
      'O CBHRMA reúne poder público, usuários de água e sociedade civil da bacia do Rio Manuel Alves, no sudeste do Tocantins. Além da gestão da água, o comitê é conhecido por ações de educação ambiental, como o viveiro de mudas nativas, a coleta de sementes e o encontro Mulheres das Águas.',
      'A mobilização começou em 2005, quando o órgão ambiental exigiu a criação de um comitê para acompanhar a barragem do programa de perenização das águas do sudeste do estado (Projeto Manuel Alves, de fruticultura irrigada). A Comissão Pró-Comitê foi formada em dezembro de 2006, e o pedido de criação chegou ao Conselho Estadual de Recursos Hídricos em dezembro de 2007.',
      'O Rio Manuel Alves pertence ao sistema do Tocantins, tem cerca de 300 km de extensão e drena 14.894 km², o equivalente a 5,4% do estado.'
    ],
    municipios: ['Almas','Chapada da Natividade','Conceição do Tocantins','Dianópolis','Natividade','Pindorama do Tocantins','Porto Alegre do Tocantins','Rio da Conceição','Santa Rosa do Tocantins','São Valério','Taipas do Tocantins']
  },
  {
    id: 'cbhrp',
    sigla: 'CBHRP',
    nome: 'Comitê da Bacia Hidrográfica do Rio Palma',
    curto: 'Rio Palma',
    cor: '#EA8549',
    banner: 'assets/img/banners/banner-rio-palma.jpg',
    logo: 'assets/img/logos/recorte/cbhrp.png',
    mapa: 'assets/img/mapas/cbhrp.jpg',
    regiao: 'Sudeste',
    area: '17.332 km²',
    criacao: '2023',
    sede: 'Taguatinga',
    resumo: 'Sudeste do estado, comitê instalado em 2023.',
    texto: [
      'O CBHRP é o colegiado de gestão participativa das águas da bacia do Rio Palma, no sudeste do Tocantins. Formado por poder público, usuários de água e sociedade civil, tem funções normativas, deliberativas e consultivas dentro do Sistema Estadual de Gerenciamento de Recursos Hídricos.',
      'A ideia de um comitê para o Rio Palma surgiu em 2005 e ganhou força em 2018, com a retomada da mobilização nos municípios. A Comissão Pró-Comitê foi reconhecida com base na Resolução CERH nº 025/2011. O comitê foi instalado em 2023 e elegeu sua primeira diretoria em dezembro daquele ano.',
      'A bacia ocupa 17.332 km² no sudeste do estado, entre as latitudes 11°24\' e 13°03\' Sul e as longitudes 46°04\' e 47°53\' Oeste.'
    ],
    municipios: ['Arraias','Aurora do Tocantins','Combinado','Conceição do Tocantins','Dianópolis','Lavandeira','Novo Alegre','Novo Jardim','Paranã','Ponte Alta do Bom Jesus','Taguatinga','Taipas do Tocantins']
  },
  {
    id: 'cbhsast',
    sigla: 'CBHSAST',
    nome: 'Comitê das Bacias Hidrográficas dos Rios Santo Antônio e Santa Tereza',
    curto: 'Rios Santo Antônio e Santa Tereza',
    cor: '#9b48e2',
    banner: 'assets/img/banners/banner-santo-antonio-santa-tereza.jpg',
    logo: 'assets/img/logos/recorte/cbhsast.png',
    mapa: 'assets/img/mapas/cbhsast.jpg',
    regiao: 'Sul',
    area: '',
    criacao: '22/03/2018',
    sede: 'Gurupi',
    resumo: 'Sul do estado, região de Gurupi.',
    texto: [
      'O CBHSAST reúne poder público, usuários de água e sociedade civil das bacias dos rios Santo Antônio e Santa Tereza, no sul do Tocantins, região de Gurupi.',
      'O comitê nasceu de um projeto do Governo do Tocantins, iniciado em 2014, para recuperar a bacia do Rio Gurupi, que corta cerca de um terço dos bairros da cidade. O projeto teve parceria da Fundação UnirG, do IFTO, da UFT, de prefeituras e de organizações da sociedade civil.',
      'Em maio de 2016 o Conselho Estadual de Recursos Hídricos aprovou a comissão provisória. Em novembro de 2017 as assembleias setoriais em Gurupi indicaram os representantes de cada segmento e, em 30 de novembro, foram eleitos e empossados a diretoria e os membros. A criação oficial foi assinada em 22 de março de 2018, na abertura da 8ª Semana da Água.'
    ],
    municipios: ['Alvorada','Cariri do Tocantins','Figueirópolis','Gurupi','Jaú do Tocantins','Peixe','Sucupira','Talismã']
  },
  {
    id: 'cbhrcc',
    sigla: 'CBHRCC',
    nome: 'Comitê das Bacias Hidrográficas dos Rios Coco e Caiapó',
    curto: 'Rios Coco e Caiapó',
    cor: '#e8b10f',
    banner: 'assets/img/banners/banner-coco-caiapo.jpg',
    logo: 'assets/img/logos/recorte/cbhrcc.png',
    mapa: 'assets/img/mapas/cbhrcc.jpg',
    regiao: 'Centro-oeste',
    area: '12.310 km²',
    criacao: '02/12/2024',
    sede: 'Caseara',
    novo: true,
    resumo: 'O comitê mais novo do Tocantins, do centro do estado até as margens do Araguaia.',
    texto: [
      'O CBHRCC é o sétimo comitê de bacia do Tocantins. Reúne poder público, usuários de água e sociedade civil dos 10 municípios das bacias dos rios Coco e Caiapó, numa região que vai de Paraíso do Tocantins até as margens do Rio Araguaia, em Caseara e Araguacema.',
      'As duas bacias somam cerca de 12.310 km²: 6.700 km² do Rio do Coco, que deságua no Araguaia em Caseara, e 5.610 km² do Rio Caiapó, que deságua junto a Araguacema (ANA, Base Hidrográfica Ottocodificada).',
      'A mobilização começou em 7 de março de 2024, quando a SEMARH instituiu a Comissão Pró-Comitê no 1º Encontro Setorial, em Caseara. O comitê foi criado pelo Decreto nº 6.868, assinado em 2 de dezembro de 2024 na abertura do 1º Encontro Regional dos Comitês de Bacias Hidrográficas da Região Norte.',
      'Em 2025, o Edital de Convocação nº 001/2025 abriu o cadastro das entidades interessadas em compor o colegiado, conforme a Resolução CERH nº 25/2011, com assembleias setoriais e eleição da diretoria previstas para Caseara.',
      'Desde junho de 2026 o comitê conta com o apoio técnico, administrativo e operacional do Procomitês para a realização de suas reuniões ordinárias, capacitações e ações de comunicação.'
    ],
    municipios: ['Abreulândia','Araguacema','Barrolândia','Caseara','Chapada de Areia','Divinópolis do Tocantins','Marianópolis do Tocantins','Monte Santo do Tocantins','Paraíso do Tocantins','Pium']
  }
];

window.PROCOMITES = {
  nome: 'Procomitês Tocantins',
  titulo: 'Inovação e Suporte Técnico à Gestão dos Comitês de Bacia Hidrográfica',
  periodo: 'Junho de 2026 a maio de 2028',
  parceiros: [
    { nome: 'Instituto Federal do Tocantins (IFTO)', papel: 'Proponente e executor do projeto' },
    { nome: 'Secretaria do Meio Ambiente e Recursos Hídricos (SEMARH-TO)', papel: 'Concedente' },
    { nome: 'Fundação de Apoio Científico e Tecnológico do Tocantins (FAPTO)', papel: 'Gestão administrativa e financeira' }
  ],
  equipe: [
    { nome: 'Otacílio Silveira Júnior', funcao: 'Coordenador Geral' },
    { nome: 'Pietro Lope Rêgo', funcao: 'Coordenador Adjunto' },
    { nome: 'Ananias Barreiros dos Santos Junior', funcao: 'Coordenador Administrativo' },
    { nome: 'Rafael Galvan Barbosa Ferraz', funcao: 'Especialista Ambiental' },
    { nome: 'Ana Rafaela Bezerra Cavalcante de Sousa', funcao: 'Apoio Técnico em Extensão' }
  ],
  metas: [
    { numero: '7', texto: 'comitês atendidos com apoio técnico, logístico e operacional' },
    { numero: '56', texto: 'reuniões ordinárias com suporte (4 por ano em cada comitê)' },
    { numero: '8', texto: 'capacitações para membros titulares e suplentes' },
    { numero: '210', texto: 'membros capacitados e certificados, no mínimo' },
    { numero: '7', texto: 'planos de comunicação e 7 cartilhas temáticas, uma por bacia' },
    { numero: '24', texto: 'meses de suporte logístico e operacional' }
  ],
  acoes: [
    ['Equipe técnica', 'Equipe multidisciplinar que planeja, executa e acompanha o apoio aos comitês e elabora pareceres e relatórios técnicos.'],
    ['Comunicação', 'Um plano de comunicação para cada comitê, com cartilhas, folders, banners, redes sociais, vídeos e este site.'],
    ['Capacitações', 'Apoio à metodologia, material didático, logística e certificação das capacitações dos membros.'],
    ['Reuniões ordinárias', 'Convocação, materiais, diárias, registro fotográfico, atas publicadas no site e transmissão das reuniões on-line.'],
    ['Encontros nacionais', 'Passagens e diárias para que ao menos dois representantes de cada comitê participem do Encontro Nacional de Comitês de Bacia.'],
    ['Logística', 'Veículos, combustível e materiais para reuniões, capacitações e visitas de campo nos sete territórios.']
  ]
};

window.FAQ = [
  ['O que é uma bacia hidrográfica?', 'É toda a área de terra cuja água escorre para um mesmo rio principal, incluindo os córregos, riachos e ribeirões que deságuam nele.'],
  ['O que é um comitê de bacia hidrográfica?', 'É um colegiado de representantes do poder público, dos usuários de água e da sociedade civil que se reúne periodicamente para decidir sobre o uso da água na bacia. Faz parte do Sistema Nacional de Gerenciamento de Recursos Hídricos.'],
  ['Por que os comitês são organizados por bacia?', 'Porque a bacia é a unidade natural da água: o que se faz rio acima afeta quem está rio abaixo. A Lei nº 9.433/1997 adota a bacia como unidade de planejamento.'],
  ['O que é gerenciamento de recursos hídricos?', 'É administrar o uso da água para que haja quantidade e qualidade suficientes para todos os usos, hoje e no futuro.'],
  ['Como funciona um comitê?', 'A composição é tripartite: poder público, usuários de água e sociedade civil organizada. As decisões são tomadas em plenário, e as Câmaras Técnicas preparam os estudos que dão base a elas.'],
  ['O que o comitê faz?', 'Promove o debate sobre o uso da água, media conflitos em primeira instância administrativa, aprova e acompanha o Plano de Recursos Hídricos da bacia, propõe a cobrança pelo uso da água e elabora o relatório anual da situação da bacia.'],
  ['O comitê executa obras ou projetos?', 'Não. O comitê é um "parlamento das águas", com funções normativas, deliberativas e consultivas. A execução cabe à agência de bacia ou à entidade de apoio.'],
  ['O que é o Procomitês?', 'É o projeto do Instituto Federal do Tocantins, com a SEMARH e a FAPTO, que dá apoio técnico, administrativo e operacional aos sete comitês do estado entre junho de 2026 e maio de 2028.'],
  ['Como participar de um comitê?', 'As vagas são preenchidas por instituições do poder público, de usuários de água e da sociedade civil, em processos eleitorais divulgados pelo comitê. As reuniões são abertas ao público. Fale com a secretaria do comitê da sua região.'],
  ['E se a minha região não tiver comitê?', 'Consórcios de municípios, associações de usuários e de produtores, colônias de pescadores e universidades podem iniciar a discussão. Essas organizações costumam ser a base para formar um novo comitê.']
];
