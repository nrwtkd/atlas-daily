import type { MascotStage } from "../domain/dailyRules";

export default function Mascot({ stage, celebrating = false }: { stage: MascotStage; celebrating?: boolean }) {
  const stageIndex = ["seed", "sprout", "explorer", "guardian"].indexOf(stage.id);
  return (
    <div className={`mascotWrap stage-${stage.id} ${celebrating ? "celebrating" : ""}`} aria-label={`Maskot Tala, tahap ${stage.label}`}>
      <svg className="mascotSvg" viewBox="0 0 240 230" role="img">
        <ellipse className="mascotShadow" cx="120" cy="205" rx="63" ry="12" />
        {stageIndex >= 2 && <path className="backpack" d="M63 104c-18 8-23 28-15 51 4 12 15 18 27 13l10-5-8-63-14 4Z" />}
        <path className="mascotBody" d="M120 54c43 0 72 34 72 78 0 45-30 70-72 70s-72-25-72-70c0-44 29-78 72-78Z" />
        {stageIndex >= 1 && <>
          <path className="leafOne" d="M119 59C97 40 99 18 102 8c20 7 31 24 24 47" />
          <path className="leafTwo" d="M126 55c4-25 22-34 36-35-1 19-12 35-36 40" />
        </>}
        {stageIndex >= 2 && <path className="scarf" d="M66 108c33 13 73 15 108-1l4 16c-37 17-82 16-116 0l4-15Z" />}
        {stageIndex >= 3 && <>
          <path className="crown" d="m89 60 9-25 22 17 20-20 12 28Z" />
          <path className="crownStar" d="m121 35 4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1 4-8Z" />
        </>}
        <circle className="eye" cx="95" cy="116" r="6" />
        <circle className="eye" cx="145" cy="116" r="6" />
        <path className="mouth" d={celebrating ? "M105 137c8 13 22 13 30 0" : "M108 139c7 7 17 7 24 0"} />
        <circle className="cheek" cx="82" cy="135" r="8" />
        <circle className="cheek" cx="158" cy="135" r="8" />
        <path className="arm left" d="M54 130c-19 6-27 20-25 31" />
        <path className="arm right" d={celebrating ? "M185 128c18-8 25-23 22-35" : "M185 131c17 5 24 17 23 29"} />
      </svg>
    </div>
  );
}
