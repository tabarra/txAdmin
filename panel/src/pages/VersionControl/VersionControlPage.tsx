import { ChangeEvent, useCallback, useEffect, useState } from "react";
import VersionControlHeader from "./VersionControlHeader";
import { Button } from "@/components/ui/button";
import { useAuthedFetcher } from "@/hooks/fetch";
import { useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";

interface Resource {
  submoduleName: string;
  repository: string;
  path: string;
  commit: string;
  isUpToDate:
    | true
    | {
        prId: number;
        latestCommit: string;
      };
}

export default function VersionControlPage() {
  const authedFetcher = useAuthedFetcher();
  const [repository, setRepository] = useState<string>(
    "westroleplay/local-dev-env"
  );
  const [childAmount, setChildAmount] = useState<number | string>("...");
  const [updateAvailableAmount, setUpdateAvailableAmount] = useState<
    number | string
  >("...");
  const [searchValue, setSearchValue] = useState<string>("");
  const [error, setError] = useState("");
  const {
    isPending: queryIsPending,
    error: queryError,
    data: queryData
  } = useQuery<{
    resources: Resource[];
  }>({
    queryKey: ["getResources"],
    gcTime: 30_000,
    queryFn: () => authedFetcher("/versionControl/resources")
  });
  const [formattedResources, setFormattedResources] = useState<Resource[]>([]);

  useEffect(() => {
    if (queryData !== undefined) {
      setChildAmount(queryData.resources.length);
      setUpdateAvailableAmount(
        queryData.resources.filter((r) => r.isUpToDate !== true).length
      );
    }
  }, [queryData]);

  useEffect(() => {
    setError(queryError ? queryError.message : "");
  }, [queryError]);

  const updateSearchValue = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  }, []);

  const alphabeticalSort = (a: Resource, b: Resource) => {
    if (a.repository < b.repository) {
      return -1;
    }
    if (a.repository > b.repository) {
      return 1;
    }
    return 0;
  };

  useEffect(() => {
    if (queryData !== undefined) {
      let newFilteredResources = queryData.resources;

      if (searchValue.trim().length !== 0) {
        newFilteredResources = newFilteredResources.filter((r) => {
          return (
            r.repository.toLowerCase().indexOf(searchValue.toLowerCase()) !==
              -1 ||
            r.path.toLowerCase().indexOf(searchValue.toLowerCase()) !== -1 ||
            r.submoduleName.toLowerCase().indexOf(searchValue.toLowerCase()) !==
              -1
          );
        });
      }

      setFormattedResources([
        // We want the outdated resources to be first
        // But we also wish for each list (outdated & up-to-date) to be alphabetically sorted
        ...newFilteredResources
          .filter((r) => r.isUpToDate !== true)
          .sort(alphabeticalSort),
        ...newFilteredResources
          .filter((r) => r.isUpToDate === true)
          .sort(alphabeticalSort)
      ]);
    }
  }, [searchValue, queryData]);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <VersionControlHeader
        repository={repository}
        updateAvailableAmount={updateAvailableAmount}
        childAmount={childAmount}
      />

      <div className="dark text-primary flex flex-col h-full w-full bg-card border md:rounded-xl overflow-clip py-4 gap-4">
        <input
          className="p-2 rounded bg-primary-foreground border mx-4"
          type="text"
          name="resource"
          id="resourceInput"
          value={searchValue}
          onChange={updateSearchValue}
          placeholder="Filter child repositories by name..."
        />

        <div className="flex flex-col relative h-full">
          {error ? (
            <div className="my-auto mx-auto w-fit h-fit">
              <h1 className="text-destructive font-bold text-[1.4rem]">
                Couldnt fetch resources...
              </h1>
              <p className="text-destructive text-center text-[1.1rem]">
                {error}
              </p>
            </div>
          ) : queryIsPending === true ? (
            <LoaderCircle className="my-auto mx-auto w-24 h-24 animate-spin" />
          ) : (
            formattedResources.map((r) => {
              return (
                <div
                  key={r.submoduleName}
                  className="flex flex-row justify-between py-2 odd:bg-slate-100/5 px-4"
                >
                  <div className="flex flex-col">
                    <h1>
                      <a
                        href={`https://github.com/${r.repository}`}
                        target="_blank"
                      >
                        <span
                          className={
                            r.isUpToDate === true
                              ? "hover:[text-shadow:_0px_0px_3px_#00bf8f] text-[#00bf8f]"
                              : "hover:[text-shadow:_0px_0px_3px_#fd4a4a] text-[#fd4a4a]"
                          }
                        >
                          {r.repository}
                        </span>
                      </a>{" "}
                      (
                      <a
                        target="_blank"
                        href={`https://github.com/${r.repository}/commit/${r.commit}`}
                      >
                        <span className="hover:[text-shadow:_0px_0px_3px_#fff]">
                          {r.commit}
                        </span>
                      </a>
                      {r.isUpToDate !== true ? (
                        <a
                          target="_blank"
                          href={`https://github.com/${r.repository}/commit/${r.isUpToDate.latestCommit}`}
                        >
                          <span className="hover:[text-shadow:_0px_0px_3px_#fff] font-bold">
                            {`, newest: ${r.isUpToDate.latestCommit}`}
                          </span>
                        </a>
                      ) : null}
                      )
                    </h1>
                    <h2 className="text-muted-foreground">{r.path}</h2>
                  </div>

                  <div className="flex flex-col justify-center">
                    {r.isUpToDate !== true ? (
                      <a
                        href={`https://github.com/${repository}/pull/${r.isUpToDate.prId.toString()}`}
                        target="_blank"
                      >
                        <Button
                          variant="outline"
                          color="primary"
                          size="sm"
                          className="border-warning text-warning hover:bg-warning hover:text-white"
                        >
                          View Update PR
                        </Button>
                      </a>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
