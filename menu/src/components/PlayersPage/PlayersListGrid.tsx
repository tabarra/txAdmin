import React, { useEffect, useRef, useState } from "react";
import { useFilteredSortedPlayers } from "../../state/players.state";
import PlayerCard from "./PlayerCard";
import { Box, CircularProgress, makeStyles } from "@material-ui/core";

const MAX_PER_BUCKET = 40;
const FAKE_LOAD_TIME = 1000;

const useStyles = makeStyles({
  wrapper: {
    overflow: "auto",
  },
  loadTrigger: {
    height: 50,
  },
  loadingSpinner: {
    display: "flex",
    justifyContent: "center",
  },
});

export const PlayersListGrid: React.FC = () => {
  const classes = useStyles();
  const filteredPlayers = useFilteredSortedPlayers();
  const [bucket, setBucket] = useState(1);
  const [fakeLoading, setFakeLoading] = useState(false);
  const containerRef = useRef(null);

  // We want to reset the bucket amount when filtered list changes
  useEffect(() => {
    setBucket((prevState) => (prevState > 1 ? 1 : prevState));
  }, [filteredPlayers]);

  // Setup our intersection observer on mount
  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "40px",
      threshold: 1.0,
    });

    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      if (containerRef.current) observer.unobserve(containerRef.current);
    };
  }, []);

  const slicedPlayers = filteredPlayers.slice(0, MAX_PER_BUCKET * bucket);

  const handleObserver = (entities) => {
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
  };

  return (
    <div className={classes.wrapper}>
      <Box
        display="grid"
        gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))"
      >
        {slicedPlayers.map((player) => (
          <PlayerCard {...player} key={player.id} />
        ))}
      </Box>
      <div ref={containerRef} className={classes.loadTrigger} />
      {fakeLoading && (
        <Box className={classes.loadingSpinner}>
          <CircularProgress />
        </Box>
      )}
    </div>
  );
};
