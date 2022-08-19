import React from "react";
import { Box, styled } from "@mui/material";
import { PlayerPageHeader } from "./PlayerPageHeader";
import { useFilteredSortedPlayers } from "../../state/players.state";
import { PlayersListEmpty } from "./PlayersListEmpty";
import { PlayersListGrid } from "./PlayersListGrid";
import { usePlayerListListener } from "../../hooks/usePlayerListListener";

const RootStyled = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  height: "50vh",
  borderRadius: 15,
  flex: 1,
}));

const GridStyled = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  height: "85%",
}));

export const PlayersPage: React.FC<{ visible: boolean }> = ({ visible }) => {
  const players = useFilteredSortedPlayers();

  usePlayerListListener();

  return (
    <RootStyled
      mt={2}
      mb={10}
      pt={4}
      px={4}
      display={visible ? "initial" : "none"}
    >
      <PlayerPageHeader />
      <GridStyled>
        {players.length ? <PlayersListGrid /> : <PlayersListEmpty />}
      </GridStyled>
    </RootStyled>
  );
};
