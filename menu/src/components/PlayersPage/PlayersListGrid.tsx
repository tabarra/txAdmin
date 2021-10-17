import React, { useCallback, useEffect, useRef, useState } from "react";
import { useFilteredSortedPlayers } from "../../state/players.state";
import PlayerCard from "./PlayerCard";
import { Box, CircularProgress, styled } from "@mui/material";

const MAX_PER_BUCKET = 40;
const FAKE_LOAD_TIME = 1000;

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

  // We want to reset the bucket amount when filtered list changes
  useEffect(() => {
    setBucket((prevState) => (prevState > 1 ? 1 : prevState));
  }, [filteredPlayers]);

  const slicedPlayers = filteredPlayers.slice(0, MAX_PER_BUCKET * bucket);

  const handleObserver = useCallback(
    (entities) => {
      const lastEntry = entities[0];
      if (
        lastEntry.isIntersecting &&
        filteredPlayers.length > slicedPlayers.length
      ) {
        setFakeLoading(true);
        setTimeout(() => {
          setBucket((prevState) => prevState + 1);
          setFakeLoading(false);
        }, FAKE_LOAD_TIME);
      }
    },
    [filteredPlayers, slicedPlayers]
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
