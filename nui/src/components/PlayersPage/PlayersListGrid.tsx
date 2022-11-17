import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFilteredSortedPlayers } from "../../state/players.state";
import PlayerCard from "./PlayerCard";
import { Box, CircularProgress, styled } from "@mui/material";
import { useIsMenuVisibleValue } from "@nui/src/state/visibility.state";

const MAX_PER_BUCKET = 60;
const FAKE_LOAD_TIME = 250;

const DivWrapper = styled("div")({
  overflow: "auto",
});

const DivLoadTrigger = styled("div")({
  height: 50,
});

const BoxLoadingSpinner = styled(Box)({
  display: "flex",
  justifyContent: "center",
});

export const PlayersListGrid: React.FC = () => {
  const filteredPlayers = useFilteredSortedPlayers();
  const [bucket, setBucket] = useState(1);
  const [fakeLoading, setFakeLoading] = useState(false);
  const containerRef = useRef(null);
  const isMenuVisible = useIsMenuVisibleValue();

  useEffect(() => {
    // we want to ideally keep the same bucket as previous update cycle, if possible. preventing
    // scroll reset. if the new number of players does not reach the current bucket size, set bucket
    // to highest possible value, to limit scroll jump.
    setBucket((prevBucketState) => {
      const highestPotentialBucket = Math.ceil(
        filteredPlayers.length / MAX_PER_BUCKET
      );
      // if our greatest possible bucket point in the new updated list,
      if (highestPotentialBucket < prevBucketState)
        return highestPotentialBucket;
      else return prevBucketState;
    });
  }, [filteredPlayers]);

  const slicedPlayers = useMemo(
    () => filteredPlayers.slice(0, MAX_PER_BUCKET * bucket),
    [filteredPlayers, bucket]
  );

  const handleObserver = useCallback(
    (entities: IntersectionObserverEntry[]) => {
      const lastEntry = entities[0];

      if (!isMenuVisible) return setBucket(1)

      if (
        lastEntry.isIntersecting &&
        filteredPlayers.length > slicedPlayers.length &&
        !fakeLoading
      ) {
        setFakeLoading(true);
        setTimeout(() => {
          setBucket((prevState) => prevState + 1);
          setFakeLoading(false);
        }, FAKE_LOAD_TIME);
      }
    },
    [filteredPlayers, slicedPlayers, fakeLoading, isMenuVisible]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "10px",
      threshold: 0.9,
    });

    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      if (containerRef.current) observer.unobserve(containerRef.current);
    };
  }, [handleObserver]);

  return (
    <DivWrapper>
      <Box
        display="grid"
        gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))"
      >
        {slicedPlayers.map((player) => (
          <PlayerCard playerData={player} key={player.id} />
        ))}
      </Box>
      <DivLoadTrigger ref={containerRef} />
      {fakeLoading && (
        <BoxLoadingSpinner>
          <CircularProgress />
        </BoxLoadingSpinner>
      )}
    </DivWrapper>
  );
};
