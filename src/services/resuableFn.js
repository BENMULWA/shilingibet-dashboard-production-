import { pauseDeposit, pauseWithdrawal } from "./UsersActions";

export function handleAction({ index }) {
  const newIndex = Number(index);

  switch (newIndex) {
    case 1:
      return;
    case 2:
      return;
    case 3:
      return pauseWithdrawal("67ace37b9ed96e7f34c9c430");
    case 4:
      return pauseDeposit("67ace37b9ed96e7f34c9c430");
    default:
      return pauseWithdrawal("67ace37b9ed96e7f34c9c430");
  }
}
