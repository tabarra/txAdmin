import React, { useEffect, useState } from "react";
import {
  Box,
  InputAdornment,
  MenuItem,
  styled,
  Theme,
  Typography,
} from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import { Search, SortByAlpha } from "@mui/icons-material";
import {
  PlayerDataSort,
  usePlayersSortBy,
  usePlayersState,
  usePlayersFilter,
  useSetPlayersFilterIsTemp
} from "../../state/players.state";
import { useDebounce } from "../../hooks/useDebouce";
import { useServerCtxValue } from "../../state/server.state";
import { useTranslate } from "react-polyglot";
import { TextField } from "../misc/TextField";

const TypographyTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
}));

const TypographyPlayerCount = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontWeight: 500,
}));

const InputAdornmentIcon = styled(InputAdornment)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

const TextFieldInputs = styled(TextField)({
  minWidth: 150,
});

export const PlayerPageHeader: React.FC = () => {
  const [sortType, setSortType] = usePlayersSortBy();
  const [playerFilter, setPlayerFilter] = usePlayersFilter();
  const allPlayers = usePlayersState();
  const [searchVal, setSearchVal] = useState("");
  const setPlayersFilterIsTemp = useSetPlayersFilterIsTemp();
  const serverCtx = useServerCtxValue();
  const t = useTranslate();

  const debouncedInput = useDebounce(searchVal, 500);

  // We might need to debounce this in the future
  const handleSortData = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSortType(e.target.value as PlayerDataSort);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchVal(e.target.value);
    setPlayersFilterIsTemp(false);
  };

  useEffect(() => {
    setPlayerFilter(debouncedInput as string);
  }, [debouncedInput, setPlayerFilter]);

  // Synchronize filter from player state, used for optional args in /tx
  useEffect(() => {
    setSearchVal(playerFilter);
  }, [playerFilter])

  return (
    <Box display="flex" justifyContent="space-between">
      <Box px={2}>
        <TypographyTitle variant="h5" color="primary">
          {t("nui_menu.page_players.misc.online_players")}
        </TypographyTitle>
        <TypographyPlayerCount>
          {`${allPlayers.length}/${serverCtx.maxClients} ${t(
            "nui_menu.page_players.misc.players"
          )} - ${serverCtx.oneSync.status
            ? `OneSync (${serverCtx.oneSync.type})`
            : `OneSync Off`
            }`}
        </TypographyPlayerCount>
      </Box>
      <Box display="flex" alignItems="center" justifyContent="center">
        <TextFieldInputs
          label={t("nui_menu.page_players.misc.search")}
          value={searchVal}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornmentIcon position="start">
                <Search color="inherit" />
              </InputAdornmentIcon>
            ),
          }}
          style={{ marginRight: 20 }}
        />
        <TextFieldInputs
          label={t("nui_menu.page_players.sort.label")}
          select
          onChange={handleSortData}
          value={sortType}
          InputProps={{
            startAdornment: (
              <InputAdornmentIcon position="start">
                <SortByAlpha color="inherit" />
              </InputAdornmentIcon>
            ),
          }}
        >
          <MenuItem value={PlayerDataSort.IdJoinedFirst}>
            {`${t("nui_menu.page_players.sort.id")} (${t(
              "nui_menu.page_players.sort.joined_first"
            )})`}
          </MenuItem>
          <MenuItem value={PlayerDataSort.IdJoinedLast}>
            {`${t("nui_menu.page_players.sort.id")} (${t(
              "nui_menu.page_players.sort.joined_last"
            )})`}
          </MenuItem>
          <MenuItem value={PlayerDataSort.DistanceClosest}>
            {`${t("nui_menu.page_players.sort.distance")} (${t(
              "nui_menu.page_players.sort.closest"
            )})`}
          </MenuItem>
          <MenuItem value={PlayerDataSort.DistanceFarthest}>
            {`${t("nui_menu.page_players.sort.distance")} (${t(
              "nui_menu.page_players.sort.farthest"
            )})`}
          </MenuItem>
        </TextFieldInputs>
      </Box>
    </Box>
  );
};
