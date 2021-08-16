import useREIGNWETHLPRewardsExpectedRewards, {
  useREIGNWETHLPRewardsAPY,
  useREIGNWETHRewards,
} from "@/hooks/reignWeth";
import useFormattedBigNumber from "@/hooks/useFormattedBigNumber";
import useWeb3Store from "@/hooks/useWeb3Store";
import useHarvestableUserRewards from "@/hooks/view/useHarvestableUserRewards";
import handleError from "@/utils/handleError";
import type { TransactionResponse } from "@ethersproject/providers";
import { commify } from "@ethersproject/units";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import { TransactionToast } from "../customToast";
import HarvestRewardsCard from "./harvestRewardsCard";

export default function REIGNWETHRewardsHarvest() {
  const account = useWeb3Store((state) => state.account);
  const chainId = useWeb3Store((state) => state.chainId);

  const lpRewards = useREIGNWETHRewards();

  const { data: apy } = useREIGNWETHLPRewardsAPY();

  const { data: rewards, mutate } = useHarvestableUserRewards(
    account,
    lpRewards?.address
  );

  const { data: expectedRewards } =
    useREIGNWETHLPRewardsExpectedRewards(account);

  const formattedRewards = useFormattedBigNumber(rewards);

  const formattedExpectedRewards = expectedRewards
    ? commify(Number(expectedRewards).toFixed(2))
    : Number(0).toFixed(2);

  async function harvest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const _id = toast.loading("Waiting for confirmation");

    try {
      const transaction: TransactionResponse = await lpRewards.massHarvest();

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
      formattedExpectedRewards={formattedExpectedRewards}
      onSubmit={harvest}
      rewards={rewards}
      title="REIGN/ETH Pool Rewards"
    />
  );
}
