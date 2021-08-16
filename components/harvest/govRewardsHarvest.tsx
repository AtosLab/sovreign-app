import useGovRewards from "@/hooks/contracts/useGovRewards";
import useFormattedBigNumber from "@/hooks/useFormattedBigNumber";
import useWeb3Store from "@/hooks/useWeb3Store";
import useGovRewardsAPY from "@/hooks/useGovRewardsAPY";
import useUserRewards from "@/hooks/view/useUserRewards";
import handleError from "@/utils/handleError";
import type { TransactionResponse } from "@ethersproject/providers";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import { TransactionToast } from "../customToast";
import HarvestRewardsCard from "./harvestRewardsCard";

export default function GovRewardsHarvest() {
  const account = useWeb3Store((state) => state.account);
  const chainId = useWeb3Store((state) => state.chainId);

  const govRewards = useGovRewards();

  const { data: apy } = useGovRewardsAPY();

  const { data: rewards, mutate } = useUserRewards(
    account,
    govRewards?.address
  );

  const formattedRewards = useFormattedBigNumber(rewards);

  async function harvestGovRewards(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const _id = toast.loading("Waiting for confirmation");

    try {
      const transaction: TransactionResponse = await govRewards.massHarvest();

      toast.loading(
        <TransactionToast
          message={`Harvest ${formattedRewards} REIGN`}
          chainId={chainId}
          hash={transaction.hash}
        />,
        { id: _id }
      );

      await transaction.wait();

      toast.success(
        <TransactionToast
          message={`Harvest ${formattedRewards} REIGN`}
          chainId={chainId}
          hash={transaction.hash}
        />,
        { id: _id }
      );

      mutate();
    } catch (error) {
      handleError(error, _id);
    }
  }

  return (
    <HarvestRewardsCard
      apy={apy}
      formattedRewards={formattedRewards}
      onSubmit={harvestGovRewards}
      rewards={rewards}
      title="Governance Rewards"
    />
  );
}
