import { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";

const getStages = (t) => [
  {
    id: 0,
    label: t('germination'),
    week: `${t('week')} 1`,
    icon: "🌱",
    color: "#a8c5a0",
    desc: t('germination_desc'),
    temp: "22°C",
    water: "Low",
    health: 60,
  },
  {
    id: 1,
    label: t('vegetative'),
    week: `${t('week')} 2`,
    icon: "🌿",
    color: "#4a9060",
    desc: t('vegetative_desc'),
    temp: "25°C",
    water: "Medium",
    health: 84,
    active: true,
  },
  {
    id: 2,
    label: t('flowering'),
    week: `${t('week')} 3`,
    icon: "🌸",
    color: "#b5c4b1",
    desc: t('flowering_desc'),
    temp: "23°C",
    water: "High",
    health: 0,
  },
  {
    id: 3,
    label: t('fruiting'),
    week: `${t('week')} 4`,
    icon: "🍅",
    color: "#b5c4b1",
    desc: t('fruiting_desc'),
    temp: "26°C",
    water: "High",
    health: 0,
  },
  {
    id: 4,
    label: t('harvest_ready'),
    week: `${t('week')} 5`,
    icon: "🧺",
    color: "#b5c4b1",
    desc: t('harvest_ready_desc'),
    temp: "24°C",
    water: "Low",
    health: 0,
  },
];

export default function CropGrowthActivity() {
  const { t } = useLanguage();
  const stages = getStages(t);
  const [active, setActive] = useState(1);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnimated(true), 100);
  }, []);

  const current = stages[active];

  return (
    <div style={{
      fontFamily: "'Inter', sans-serif",
      borderRadius: "2rem",
      overflow: "hidden",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.05)",
      background: "white",
      border: "1px solid #FAF7F2"
    }} className="animate-ready">
      <div style={{
        background: "rgba(255,255,255,0.82)",
        backdropFilter: "blur(12px)",
        width: "100%",
      }}>

        {/* Header */}
        <div style={{
          padding: "28px 36px 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}>
          <div>
            <div style={{
              fontSize: 10,
              letterSpacing: "0.18em",
              color: "#7aa87a",
              textTransform: "uppercase",
              marginBottom: 6,
              fontWeight: "900"
            }}>{t('crop_growth_activity')}</div>
            <div style={{
              fontSize: 22,
              fontWeight: "900",
              color: "#1B4332",
              letterSpacing: "-0.02em",
              fontFamily: "'Playfair Display', serif"
            }}>🍅 {t('tomato_monitoring')}</div>
          </div>
          <div style={{
            background: "linear-gradient(135deg, #2D6A4F, #52B788)",
            color: "white",
            borderRadius: "10px",
            padding: "8px 18px",
            fontSize: 10,
            fontWeight: "900",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            boxShadow: "0 10px 15px -3px rgba(45, 106, 79, 0.2)",
          }}>
            {t('weekly_assessment')}
          </div>
        </div>

        {/* Progress Timeline */}
        <div style={{ padding: "36px 36px 0" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            position: "relative",
          }}>
            {/* Track line */}
            <div style={{
              position: "absolute",
              top: 28,
              left: 28,
              right: 28,
              height: 3,
              background: "#D8F3DC",
              borderRadius: 4,
              zIndex: 0,
            }} />
            
            {/* Active Track */}
            <div style={{
              position: "absolute",
              top: 28,
              left: 28,
              width: `${(active / (stages.length - 1)) * 100}%`,
              height: 3,
              background: "#2D6A4F",
              borderRadius: 4,
              zIndex: 0,
              transition: "width 0.8s cubic-bezier(.4,0,.2,1)"
            }} />

            {stages.map((stage, i) => {
              const isActive = i === active;
              const isPast = i < active;

              return (
                <div
                  key={stage.id}
                  onClick={() => setActive(i)}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    cursor: "pointer",
                    position: "relative",
                    zIndex: 1,
                    transition: "transform 0.2s",
                  }}
                >
                  {/* Circle */}
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: isActive
                      ? "linear-gradient(135deg, #2D6A4F, #52B788)"
                      : isPast
                        ? "#B7E4C7"
                        : "#F0F7EE",
                    border: isActive
                      ? "3px solid #fff"
                      : isPast
                        ? "3px solid #D8F3DC"
                        : "2px solid #FAF7F2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: isActive ? 26 : 18,
                    boxShadow: isActive
                      ? "0 10px 25px rgba(45, 106, 79, 0.3)"
                      : "none",
                    transition: "all 0.5s cubic-bezier(.4,0,.2,1)",
                    transform: isActive ? "scale(1.1)" : "scale(1)",
                    marginBottom: 12,
                  }}>
                    {stage.icon}
                  </div>

                  {/* Label */}
                  <div style={{
                    fontSize: 9,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontWeight: "900",
                    color: isActive ? "#1B4332" : "#B0C8B0",
                    textAlign: "center",
                    transition: "color 0.3s",
                  }}>{stage.label}</div>

                  {/* Week */}
                  <div style={{
                    fontSize: 10,
                    color: isActive ? "#2D6A4F" : "#B0C8B0",
                    marginTop: 2,
                    fontStyle: "italic",
                    fontWeight: "600"
                  }}>{stage.week}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail Card */}
        <div style={{
          margin: "28px 36px 36px",
          background: "#FAF7F2",
          border: "1px solid #D8F3DC",
          borderRadius: "1.5rem",
          padding: "24px 28px",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 20,
          alignItems: "center",
          transition: "all 0.4s",
        }}>
          <div>
            <div style={{
              fontSize: 13,
              color: "#1B4332",
              fontWeight: "900",
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 8,
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              <span style={{
                background: "#2D6A4F",
                color: "white",
                borderRadius: 6,
                padding: "2px 10px",
                fontSize: 10,
                letterSpacing: "0.1em",
              }}>{current.week}</span>
              {current.label} Phase
            </div>
            <div style={{
              fontSize: 14,
              color: "#40916C",
              lineHeight: 1.6,
              marginBottom: 16,
              fontWeight: "500"
            }}>{current.desc}</div>

            {/* Stats Row */}
            <div style={{ display: "flex", gap: 20 }}>
              {[
                { label: t('temperature'), value: current.temp, icon: "🌡️" },
                { label: t('water_need'), value: current.water, icon: "💧" },
              ].map(stat => (
                <div key={stat.label} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "white",
                  borderRadius: "1rem",
                  padding: "8px 16px",
                  border: "1px solid #D8F3DC",
                }}>
                  <span style={{ fontSize: 18 }}>{stat.icon}</span>
                  <div>
                    <div style={{ fontSize: 8, color: "#7aa87a", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: "900" }}>{stat.label}</div>
                    <div style={{ fontSize: 13, fontWeight: "900", color: "#1B4332" }}>{stat.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Health Gauge */}
          {current.health > 0 && (
            <div style={{ textAlign: "center", minWidth: 100 }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: `conic-gradient(#2D6A4F ${current.health * 3.6}deg, #D8F3DC 0deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                boxShadow: "0 10px 15px -3px rgba(45, 106, 79, 0.1)",
              }}>
                <div style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background: "white",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <div style={{ fontSize: 18, fontWeight: "900", color: "#1B4332" }}>{current.health}%</div>
                </div>
              </div>
              <div style={{ fontSize: 9, color: "#2D6A4F", marginTop: 8, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: "900" }}>{t('vitality')}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          borderTop: "1px solid #D8F3DC",
          padding: "16px 36px",
          background: "#FAF7F2",
          fontSize: 11,
          color: "#40916C",
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <span style={{ fontSize: 14 }}>🌿</span>
          <span>
            {t('optimal_phase_for')} <strong style={{ color: "#1B4332", fontWeight: "900" }}>{current.label}</strong> {t('tracking')}. 
            {t('ai_growth_insights')}
          </span>
        </div>
      </div>
    </div>
  );
}
