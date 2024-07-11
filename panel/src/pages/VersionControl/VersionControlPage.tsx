import { ChangeEvent, useCallback, useEffect, useState } from "react";
import VersionControlHeader from "./VersionControlHeader";

interface Resource {
  submoduleName: string;
  repository: string;
  path: string;
  isUpToDate: boolean;
}

export default function VersionControlPage() {
  const [repository, setRepository] = useState<string>(
    "westroleplay/local-dev-env"
  );
  const [childAmount, setChildAmount] = useState<number>(0);
  const [updateAvailableAmount, setUpdateAvailableAmount] = useState<number>(0);
  const [searchValue, setSearchValue] = useState<string>("");
  const [resources, setResources] = useState<Resource[]>([
    {
      submoduleName: "core",
      path: "fx-data/resources/[wsrp]/core",
      repository: "https://github.com/westroleplay/core",
      isUpToDate: true
    },
    {
      submoduleName: "default",
      path: "fx-data/resources/[wsrp]/default",
      repository: "https://github.com/westroleplay/default",
      isUpToDate: true
    },
    {
      submoduleName: "chat",
      path: "fx-data/resources/[wsrp]/chat",
      repository: "https://github.com/westroleplay/chat",
      isUpToDate: false
    },
    {
      submoduleName: "oxmysql",
      path: "fx-data/resources/[standalone]/oxmysql",
      repository: "https://github.com/overextended/core",
      isUpToDate: false
    }
  ]);

  useEffect(() => {
    setChildAmount(resources.length);
    setUpdateAvailableAmount(
      resources.filter((r) => r.isUpToDate === false).length
    );
  }, [resources]);

  const updateSearchValue = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  }, []);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <VersionControlHeader
        repository={repository}
        updateAvailableAmount={updateAvailableAmount}
        childAmount={childAmount}
      />

      <div className="dark text-primary flex flex-col h-full w-full bg-card border md:rounded-xl overflow-clip p-4">
        <input
          className="p-2 rounded bg-primary-foreground border"
          type="text"
          name="resource"
          id="resourceInput"
          value={searchValue}
          onChange={updateSearchValue}
          placeholder="Filter child repositories by name..."
        />
      </div>
    </div>
  );
}
