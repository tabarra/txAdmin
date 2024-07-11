import {
  BookIcon,
  FolderGit2,
  FolderPenIcon,
  HistoryIcon,
  RefreshCcw
} from "lucide-react";
import { Link } from "wouter";

interface Props {
  repository: string;
  childAmount: number;
  updateAvailableAmount: number;
}

export default function VersionControlHeader({
  repository,
  childAmount,
  updateAvailableAmount
}: Props) {
  return (
    <div className="flex flex-row w-full bg-card md:rounded-xl border gap-4 p-4 justify-between">
      <a href={`https://github.com/${repository}`} target="_blank">
        <div className="flex flex-row gap-4 items-center hover:bg-secondary/75 rounded-md p-2">
          <BookIcon className="h-12 aspect-square" />
          <div className="flex flex-col">
            <h2 className="text-muted-foreground">Head Repository</h2>
            <h1>{repository}</h1>
          </div>
        </div>
      </a>

      <div className="bg-muted-foreground/25 w-[1px] h-[80%] my-auto"></div>

      <div className="flex flex-row gap-4 items-center rounded-md p-2">
        <FolderGit2 className="h-12 aspect-square" />
        <div className="flex flex-col">
          <h2 className="text-muted-foreground">Resource Count</h2>
          <h1>{childAmount}</h1>
        </div>
      </div>

      <div className="bg-muted-foreground/25 w-[1px] h-[80%] my-auto"></div>

      <div className="flex flex-row gap-4 items-center rounded-md p-2">
        <FolderPenIcon className="h-12 aspect-square" />
        <div className="flex flex-col">
          <h2 className="text-muted-foreground">Out of date resources</h2>
          <h1>{updateAvailableAmount}</h1>
        </div>
      </div>

      <div className="bg-muted-foreground/25 w-[1px] h-[80%] my-auto"></div>

      <div className="flex flex-row gap-4 items-center hover:bg-secondary/75 rounded-md p-2 cursor-pointer">
        <RefreshCcw className="h-12 aspect-square" />
        <div className="flex flex-col">
          <h2>Manual Refresh</h2>
          <h1 className="text-muted-foreground">
            Check for outdated resources
          </h1>
        </div>
      </div>
    </div>
  );
}
