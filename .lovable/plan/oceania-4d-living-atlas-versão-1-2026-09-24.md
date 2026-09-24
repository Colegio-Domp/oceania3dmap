# OCEANIA 4D — Living Atlas (Versão 1)

Uma experiência de exploração geográfica da Oceania: um mapa 2D clicável comanda uma maquete 3D com relevo real, e camadas temáticas explicam a Geografia. Visual de laboratório geográfico futurista, títulos e botões em inglês, conteúdo explicativo em português.

## O que o visitante vê

1. **Tela de entrada** — "OCEANIA 4D / Digital Geographic Laboratory" com o botão ENTER THE ATLAS.
2. **Console principal** — a maquete 3D no centro, painéis ao redor:
   - **MAP**: mapa 2D da Oceania com regiões clicáveis (Austrália, Nova Zelândia, Papua-Nova Guiné, Melanésia, Micronésia, Polinésia). Clicar faz a câmera voar, centralizar e destacar a região.
   - **LAYERS**: RELEVO, CLIMA, OCEANO, VULCÕES, POPULAÇÃO, VEGETAÇÃO — cada uma muda a aparência da maquete.
   - **TIMELINE**: FORMAÇÃO → COLONIZAÇÃO → ATUALIDADE → CENÁRIO FUTURO; mover o cursor transforma a maquete (vulcanismo, cidades, expansão urbana).
   - **INFO**: ficha da região selecionada (localização, relevo, clima, população, curiosidade) em português.
3. **Maquete 3D** — ilhas com montanhas e vales de altura real, relevo submarino visível na camada OCEANO, cones de vulcão clicáveis, aglomerados urbanos na camada POPULAÇÃO. Rotação, zoom e seleção com o mouse.

Funções do documento que ficam para etapas seguintes: corte 3D (cross section), explode view, entrar na cidade em escala urbana, painel de simulação "E se?", som ambiente e modo professor.

## Aparência

Painéis escuros translúcidos, linhas finas, grade técnica, tipografia condensada/monoespaçada, destaques em ciano e âmbar, rótulos numéricos e medidores — como uma central de controle, não um site comum.

## Detalhes técnicos

- React Three Fiber + drei + three sobre a rota `/` (client-only, `ssr: false`), HUD em DOM sobreposto ao canvas.
- Terreno procedural: heightmap gerado por ruído com máscaras por região, definido num único módulo de dados (`oceania.ts`) com bounds, altura, clima, população e vulcões por região — assim mapa 2D, maquete e fichas leem a mesma fonte.
- Camadas trocam a coloração do terreno via gradiente por altitude/valor e ligam/desligam grupos (vulcões, cidades, malha oceânica).
- Câmera: rig de voo com interpolação suave (damping por `Math.exp(-k*dt)`) até o alvo da região; movimento todo baseado em `delta`.
- Tokens de cor no `src/styles.css` (oklch); nenhum valor de cor solto nos componentes.
- `head()` próprio na rota com título, descrição e og/twitter do projeto.
- Nenhum backend necessário nesta etapa; sem armazenamento de dados.

## Verificação

Screenshot da cena pelo navegador para confirmar maquete iluminada, mapa, camadas e timeline funcionando, e console sem erros.
