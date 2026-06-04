import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

type Props = {
  language?: "es" | "en";
};

type ScatterItem = {
  name: string;
  precio: number;
  velocidad: number;
};

type PieItem = {
  name: string;
  value: number;
};

type BarItem = {
  mes: string;
  Encipharm: number;
  Zoetis: number;
  "Drag Pharma": number;
};

function MapaCompetitivo({ language = "es" }: Props) {
  const text = {
    es: {
      header: "Mapa competitivo",
      title: "📊 Inteligencia de mercado",
      description:
        "Visualización estratégica del posicionamiento competitivo y participación de mercado.",
      participation: "Participación",
      opportunity: "Oportunidad",
      status: "Estado mercado",
      active: "Activo",
      criticalRisk: "Riesgo principal",
      pricing: "Presión de precios",
      nutrition: "Nutrición animal",
      marketOperational: "Mercado monitoreado",
      competitivePositioning: "🎯 Posicionamiento competitivo",
      competitiveDesc:
        "Precio relativo vs velocidad regulatoria.",
      marketDistribution:
        "📈 Distribución mercado",
      marketDistributionDesc:
        "Participación estimada por empresa.",
      imports:
        "📦 Tendencia importaciones",
      importsDesc:
        "Comparación mensual de movimientos.",
      relativePrice:
        "Precio relativo",
      regulatorySpeed:
        "Velocidad regulatoria",
      competitors:
        "Competidores",
    },

    en: {
      header: "Competitive map",
      title: "📊 Market intelligence",
      description:
        "Strategic visualization of competitive positioning and market share.",
      participation: "Participation",
      opportunity: "Opportunity",
      status: "Market status",
      active: "Active",
      criticalRisk: "Main risk",
      pricing: "Pricing pressure",
      nutrition: "Animal nutrition",
      marketOperational:
        "Market monitored",
      competitivePositioning:
        "🎯 Competitive positioning",
      competitiveDesc:
        "Relative pricing vs regulatory speed.",
      marketDistribution:
        "📈 Market distribution",
      marketDistributionDesc:
        "Estimated market share by company.",
      imports:
        "📦 Import trends",
      importsDesc:
        "Monthly movement comparison.",
      relativePrice:
        "Relative price",
      regulatorySpeed:
        "Regulatory speed",
      competitors:
        "Competitors",
    },
  };

  const t = text[language];

  const scatterData: ScatterItem[] = [
    {
      name: "Encipharm",
      precio: 40,
      velocidad: 60,
    },
    {
      name: "Zoetis",
      precio: 70,
      velocidad: 40,
    },
    {
      name: "Drag Pharma",
      precio: 55,
      velocidad: 50,
    },
    {
      name: "Agrovet",
      precio: 45,
      velocidad: 75,
    },
  ];

  const pieData: PieItem[] = [
    {
      name: "Encipharm",
      value: 34,
    },
    {
      name: "Zoetis",
      value: 28,
    },
    {
      name: "Drag Pharma",
      value: 21,
    },
    {
      name: "Agrovet",
      value: 17,
    },
  ];

  const barData: BarItem[] = [
    {
      mes: "JAN",
      Encipharm: 42,
      Zoetis: 32,
      "Drag Pharma": 24,
    },
    {
      mes: "FEB",
      Encipharm: 55,
      Zoetis: 38,
      "Drag Pharma": 29,
    },
    {
      mes: "MAR",
      Encipharm: 61,
      Zoetis: 44,
      "Drag Pharma": 35,
    },
  ];

  const colors: string[] = [
    "#16a34a",
    "#ef4444",
    "#f59e0b",
    "#0066b3",
  ];

  return (
    <main className="main">
      <section className="page-header-pro">
        <div>
          <span>{t.header}</span>

          <h1>{t.title}</h1>

          <p>{t.description}</p>
        </div>

        <div className="page-actions">
          <button className="btn-light">
            🔄 Live
          </button>

          <button className="btn-main">
            📡 Market Scan
          </button>
        </div>
      </section>

      <section className="map-insights">
        <div>
          <span>{t.criticalRisk}</span>

          <strong>{t.pricing}</strong>

          <p>
            Zoetis mantiene presión
            competitiva en precios.
          </p>
        </div>

        <div>
          <span>{t.opportunity}</span>

          <strong>{t.nutrition}</strong>

          <p>
            Categoría con crecimiento
            favorable.
          </p>
        </div>

        <div>
          <span>{t.status}</span>

          <strong>{t.active}</strong>

          <p>
            {t.marketOperational}
          </p>
        </div>
      </section>

      <section className="map-layout-pro">
        <div className="map-chart-card wide">
          <div className="chart-heading">
            <div>
              <h2>
                {
                  t.competitivePositioning
                }
              </h2>

              <p>
                {t.competitiveDesc}
              </p>
            </div>
          </div>

          <ResponsiveContainer
            width="100%"
            height={330}
          >
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                type="number"
                dataKey="precio"
                name={
                  t.relativePrice
                }
              />

              <YAxis
                type="number"
                dataKey="velocidad"
                name={
                  t.regulatorySpeed
                }
              />

              <Scatter
                name={t.competitors}
                data={scatterData}
                fill="#0066b3"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="map-chart-card">
          <div className="chart-heading">
            <h2>
              {
                t.marketDistribution
              }
            </h2>

            <p>
              {
                t.marketDistributionDesc
              }
            </p>
          </div>

          <ResponsiveContainer
            width="100%"
            height={280}
          >
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={95}
              >
                {pieData.map(
                  (
                    item,
                    index
                  ) => (
                    <Cell
                      key={item.name}
                      fill={
                        colors[
                          index %
                            colors.length
                        ]
                      }
                    />
                  )
                )}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="map-chart-card full">
        <div className="chart-heading">
          <h2>{t.imports}</h2>

          <p>{t.importsDesc}</p>
        </div>

        <ResponsiveContainer
          width="100%"
          height={330}
        >
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="mes" />

            <YAxis />

            <Bar
              dataKey="Encipharm"
              fill="#16a34a"
              radius={[8, 8, 0, 0]}
            />

            <Bar
              dataKey="Zoetis"
              fill="#ef4444"
              radius={[8, 8, 0, 0]}
            />

            <Bar
              dataKey="Drag Pharma"
              fill="#f59e0b"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </main>
  );
}

export default MapaCompetitivo;