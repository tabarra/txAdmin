import React, { useEffect, useState } from "react";
import {
  Box,
  InputAdornment,
  MenuItem,
  styled,
  Typography,
} from "@mui/material";
import { FilterAlt, Search, SwapVert } from "@mui/icons-material";
import {
  PlayerDataFilter,
  PlayerDataSort,
  usePlayersFilterBy,
  usePlayersSortBy,
  usePlayersState,
  usePlayersSearch,
  useSetPlayersFilterIsTemp,
} from "../../state/players.state";
import { useServerCtxValue } from "../../state/server.state";
import { useTranslate } from "react-polyglot";
import { TextField } from "../misc/TextField";
import { useDebounce } from "@nui/src/hooks/useDebouce";

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
  const [filterType, setFilterType] = usePlayersFilterBy();
  const [sortType, setSortType] = usePlayersSortBy();
  const [playerSearch, setPlayerSearch] = usePlayersSearch();
  const allPlayers = usePlayersState();
  const [searchVal, setSearchVal] = useState("");
  const setPlayersFilterIsTemp = useSetPlayersFilterIsTemp();
  const serverCtx = useServerCtxValue();
  const t = useTranslate();

  const debouncedInput = useDebounce<string>(searchVal, 500);

  // We might need to debounce this in the future
  const onFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterType(e.target.value as PlayerDataFilter);
  };
  const onSortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSortType(e.target.value as PlayerDataSort);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchVal(e.target.value);
    setPlayersFilterIsTemp(false);
  };

  useEffect(() => {
    setPlayerSearch(debouncedInput);
  }, [debouncedInput]);

  // Synchronize filter from player state, used for optional args in /tx
  useEffect(() => {
    setSearchVal(playerSearch);
  }, [playerSearch]);


  const playerTranslation = t("nui_menu.page_players.misc.players");
  const oneSyncStatus = serverCtx.oneSync.status 
    ? `OneSync (${serverCtx.oneSync.type})` 
    : `OneSync Off`;
  const playerCountText = `${allPlayers.length}/${serverCtx.maxClients} ${playerTranslation} - ${oneSyncStatus}`;

  return (
    <Box display="flex" justifyContent="space-between">
      <Box px={2}>
        <TypographyTitle variant="h5" color="primary">
          {t("nui_menu.page_players.misc.online_players")}
        </TypographyTitle>
        <TypographyPlayerCount>
          {playerCountText}
        </TypographyPlayerCount>
      </Box>
      <Box display="flex" alignItems="center" justifyContent="center" gap={3}>
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
        />
        <TextFieldInputs
          label={t("nui_menu.page_players.filter.label")}
          select
          onChange={onFilterChange}
          value={filterType}
          InputProps={{
            startAdornment: (
              <InputAdornmentIcon position="start">
                <FilterAlt color="inherit" />
              </InputAdornmentIcon>
            ),
          }}
        >
          <MenuItem value={PlayerDataFilter.NoFilter}>
            {t("nui_menu.page_players.filter.no_filter")}
          </MenuItem>
          <MenuItem value={PlayerDataFilter.IsAdmin}>
            {t("nui_menu.page_players.filter.is_admin")}
          </MenuItem>
          <MenuItem value={PlayerDataFilter.IsInjured}>
            {t("nui_menu.page_players.filter.is_injured")}
          </MenuItem>
          <MenuItem value={PlayerDataFilter.InVehicle}>
            {t("nui_menu.page_players.filter.in_vehicle")}
          </MenuItem>
        </TextFieldInputs>
        <TextFieldInputs
          label={t("nui_menu.page_players.sort.label")}
          select
          onChange={onSortChange}
          value={sortType}
          InputProps={{
            startAdornment: (
              <InputAdornmentIcon position="start">
                <SwapVert color="inherit" />
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
