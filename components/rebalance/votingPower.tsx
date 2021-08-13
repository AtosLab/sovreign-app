import useFormattedBigNumber from "@/hooks/useFormattedBigNumber";
import useVotingPower from "@/hooks/view/useVotingPower";
import Link from "next/link";
import { Plus } from "react-feather";

export default function VotingPower() {
  const { data: votingPower } = useVotingPower();

  const fmVotingPower = useFormattedBigNumber(votingPower?.votingPower, 0);

  const fmVotingPowerAtTs = useFormattedBigNumber(
    votingPower?.votingPowerAtTs,
    0
  );

  const fmReignStakedAtTs = useFormattedBigNumber(
    votingPower?.reignStakedAtTs,
    0
  );

  const fmReignStaked = useFormattedBigNumber(votingPower?.reignStaked, 0);

  return (
    <>
      <div className="flex-1 bg-primary-400 rounded-xl ring-1 ring-inset ring-white ring-opacity-10 p-4">
        <div className="flex justify-between mb-4">
          <h2 className="font-medium leading-5">Next epoch’s voting power</h2>

          <Link href="/stake">
            <a>
              <Plus size={20} />
            </a>
          </Link>
        </div>

        <p className="text-2xl leading-none font-semibold">
          {fmVotingPower} <span className="text-gray-500">/</span>
          <br />
          <span className="text-lg leading-none">{`${fmReignStaked} votes`}</span>
        </p>
      </div>

      <div className="flex-1 bg-primary-400 rounded-xl ring-1 ring-inset ring-white ring-opacity-10 p-4">
        <div className="flex justify-between mb-4">
          <h2 className="font-medium leading-5">This epoch’s voting power</h2>
        </div>

        <p className="text-2xl leading-none font-semibold">
          {fmVotingPowerAtTs} <span className="text-gray-500">/</span>
          <br />
          <span className="text-lg leading-none">{`${fmReignStakedAtTs} votes`}</span>
        </p>
      </div>
    </>
  );
}
