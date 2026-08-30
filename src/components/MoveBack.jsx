import { useMoveBack } from "../hooks/useMoveBack";
import { ArrowLeft2 } from "iconsax-react";

function MoveBack() {
  const moveBack = useMoveBack();
  return (
    <div className="text-left p-3" onClick={moveBack}>
      <ArrowLeft2 size="24" color="#4A4A4A" className="text-textGrey" />
    </div>
  );
}
export default MoveBack;
