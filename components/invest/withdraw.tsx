import {
  CONTRACT_ADDRESSES,
  MaxUint256,
  POOL_ADDRESS,
  TOKEN_ADDRESSES,
} from "@/constants";
import useERC20 from "@/hooks/contracts/useERC20";
import usePoolRouter from "@/hooks/contracts/usePoolRouter";
import useInput from "@/hooks/useInput";
import useWeb3Store from "@/hooks/useWeb3Store";
import useGetPoolTokens from "@/hooks/view/useGetPoolTokens";
import { useTokenAllowanceForPoolRouter } from "@/hooks/view/useTokenAllowance";
import useTokenBalance from "@/hooks/view/useTokenBalance";
import handleError from "@/utils/handleError";
import type { BigNumber } from "@ethersproject/bignumber";
import type { TransactionResponse } from "@ethersproject/providers";
import { formatUnits, parseUnits } from "@ethersproject/units";
import classNames from "classnames";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { TransactionToast } from "../customToast";
import NumericalInput from "../numericalInput";
import TokenSelect, { Token } from "../tokenSelect";

export default function Withdraw() {
  const account = useWeb3Store((state) => state.account);
  const chainId = useWeb3Store((state) => state.chainId);

  const poolRouter = usePoolRouter();

  const { data: poolTokens } = useGetPoolTokens();

  const sovContract = useERC20(TOKEN_ADDRESSES.SOV[chainId]);

  const { data: sovBalance, mutate: sovBalanceMutate } = useTokenBalance(
    account,
    TOKEN_ADDRESSES.SOV[chainId]
  );
  const { data: sovAllowance, mutate: sovAllowanceMutate } =
    useTokenAllowanceForPoolRouter(TOKEN_ADDRESSES.SOV[chainId], account);

  const [withdrawToken, withdrawTokenSet] = useState<Token>();

  const withdrawAmountInput = useInput();

  const withdrawTokenContract = useERC20(withdrawToken?.address);

  const sovNeedsApproval = useMemo(() => {
    if (!!sovAllowance && withdrawAmountInput.hasValue) {
      return sovAllowance.lt(parseUnits(withdrawAmountInput.value));
    }

    return;
  }, [sovAllowance, withdrawAmountInput.hasValue, withdrawAmountInput.value]);

  async function tokenWithdraw(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const _id = toast.loading("Waiting for confirmation");

    const values = event.target as typeof event.target & {
      withdrawAmount: { value: string };
    };

    try {
      const minAmountOut = parseUnits(values.withdrawAmount.value);

      const poolBalance: BigNumber = await withdrawTokenContract.balanceOf(
        POOL_ADDRESS[chainId]
      );

      const maxWithdraw = poolBalance.div(3);

      if (minAmountOut.gt(maxWithdraw)) {
        const fmMaxWithdraw = parseFloat(formatUnits(maxWithdraw)).toFixed(2);

        throw new Error(
          `Maximum Withdraw: ${fmMaxWithdraw} ${withdrawToken.symbol}`
        );
      }

      const poolAmountIn: BigNumber = await poolRouter.getSovAmountInSingle(
        withdrawToken.address,
        minAmountOut,
        MaxUint256
      );

      if (poolAmountIn.gt(sovBalance)) {
        throw new Error("Not Enough SOV");
      }

      const transaction: TransactionResponse = await poolRouter.withdraw(
        withdrawToken.address,
        poolAmountIn,
        /**
         * Account for 1% slippage
         */
        minAmountOut.mul(99).div(100)
      );

      toast.loading(
        <TransactionToast
          message={`Withdraw ${values.withdrawAmount.value} ${withdrawToken.symbol}`}
          chainId={chainId}
          hash={transaction.hash}
        />,
        { id: _id }
      );

      await transaction.wait();

      toast.success(
        <TransactionToast
          message={`Withdraw ${values.withdrawAmount.value} ${withdrawToken.symbol}`}
          chainId={chainId}
          hash={transaction.hash}
        />,
        { id: _id }
      );

      sovBalanceMutate();
    } catch (error) {
      handleError(error, _id);
    }
  }

  async function approveSOV() {
    const _id = toast.loading("Waiting for confirmation");

    try {
      const transaction: TransactionResponse = await sovContract.approve(
        CONTRACT_ADDRESSES.PoolRouter[chainId],
        MaxUint256
      );

      toast.loading(`Approve SOV`, { id: _id });

      await transaction.wait();

      toast.success(`Approve SOV`, { id: _id });

      sovAllowanceMutate();
    } catch (error) {
      handleError(error, _id);
    }
  }

  return (
    <form className="space-y-4" onSubmit={tokenWithdraw}>
      <div className="flex justify-between">
        <h2 className="font-medium leading-5">Withdraw</h2>
      </div>

      <div className="flex space-x-4">
        <div>
          <div className="mb-2">
            <TokenSelect
              value={withdrawToken}
              onChange={withdrawTokenSet}
              tokens={poolTokens}
            />
          </div>

          <div className="h-5" />
        </div>

        <div className="flex-1">
          <label className="sr-only" htmlFor="withdrawAmount">
            Enter amount of token to receive
          </label>

          <NumericalInput
            name="withdrawAmount"
            id="withdrawAmount"
            required
            {...withdrawAmountInput.valueBind}
          />
        </div>
      </div>

      <div className="space-y-4">
        {sovNeedsApproval && (
          <button
            className="p-4 w-full rounded-md text-lg font-medium leading-5 focus:outline-none focus:ring-4 bg-white text-primary"
            onClick={approveSOV}
            type="button"
          >
            {`Approve Sovreign To Spend Your SOV`}
          </button>
        )}

        <button
          className={classNames(
            "p-4 w-full rounded-md text-lg font-medium leading-5 focus:outline-none focus:ring-4",
            withdrawAmountInput.hasValue && !!withdrawToken && !sovNeedsApproval
              ? "bg-white text-primary"
              : "bg-primary-300"
          )}
          type="submit"
          disabled={
            !(withdrawAmountInput.hasValue && !!withdrawToken) ||
            sovNeedsApproval
          }
        >
          {withdrawAmountInput.hasValue && !!withdrawToken
            ? "Withdraw"
            : "Enter an amount"}
        </button>
      </div>
    </form>
  );
}
