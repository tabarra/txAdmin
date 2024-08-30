import React, { memo } from "react";
import { styled } from "@mui/material/styles";
import { Box, Paper, Theme, Tooltip, Typography } from "@mui/material";
import {
  DirectionsBoat,
  DirectionsWalk,
  DriveEta,
  LiveHelp,
  TwoWheeler,
  Flight,
} from "@mui/icons-material";
import { useSetAssociatedPlayer } from "../../state/playerDetails.state";
import { formatDistance } from "../../utils/miscUtils";
import { useTranslate } from "react-polyglot";
import { PlayerData, VehicleStatus } from "../../hooks/usePlayerListListener";
import { useSetPlayerModalVisibility } from "@nui/src/state/playerModal.state";

const PREFIX = "PlayerCard";

const classes = {
  paper: `${PREFIX}-paper`,
  barBackground: `${PREFIX}-barBackground`,
  barInner: `${PREFIX}-barInner`,
  icon: `${PREFIX}-icon`,
  tooltipOverride: `${PREFIX}-tooltipOverride`,
};

const StyledBox = styled(Box)(({ theme }) => ({
  [`& .${classes.paper}`]: {
    padding: 20,
    borderRadius: 10,
    cursor: "pointer",
    "&:hover": {
      backgroundColor: theme.palette.action.selected,
    },
  },

  [`& .${classes.barBackground}`]: {
    background: theme.palette.primary.dark,
    height: 5,
    borderRadius: 10,
    overflow: "hidden",
  },

  [`& .${classes.barInner}`]: {
    height: "100%",
    background: theme.palette.primary.main,
  },

  [`& .${classes.icon}`]: {
    paddingRight: 7,
    color: theme.palette.primary.main,
  },

  [`& .${classes.tooltipOverride}`]: {
    fontSize: 12,
  },
}));

const determineHealthBGColor = (val: number) => {
  if (val === -1) return "#4A4243";
  else if (val <= 20) return "#4a151b";
  else if (val <= 60) return "#624d18";
  else return "#097052";
};

const determineHealthColor = (val: number, theme: Theme) => {
  if (val === -1) return "#4A4243";
  else if (val <= 20) return theme.palette.error.light;
  else if (val <= 60) return theme.palette.warning.light;
  else return theme.palette.success.light;
};

const HealthBarBackground = styled(Box, {
  shouldForwardProp: (prop) => prop !== "healthVal",
})<{ healthVal: number }>(({ healthVal }) => ({
  background: determineHealthBGColor(healthVal),
  height: 5,
  borderRadius: 10,
  overflow: "hidden",
}));

const HealthBar = styled(Box, {
  shouldForwardProp: (prop) => prop !== "healthVal",
})<{ healthVal: number }>(({ theme, healthVal }) => ({
  background: determineHealthColor(healthVal, theme),
  height: 5,
  borderRadius: 10,
  overflow: "hidden",
}));

const PlayerCard: React.FC<{ playerData: PlayerData }> = ({ playerData }) => {
  const setModalOpen = useSetPlayerModalVisibility();
  const setAssociatedPlayer = useSetAssociatedPlayer();
  const t = useTranslate();

  const statusIcon: { [K in VehicleStatus]: JSX.Element } = {
    unknown: <LiveHelp color="inherit" />,
    walking: <DirectionsWalk color="inherit" />,
    driving: <DriveEta color="inherit" />,
    boating: <DirectionsBoat color="inherit" />,
    biking: <TwoWheeler color="inherit" />,
    flying: <Flight color="inherit" />,
  };

  const handlePlayerClick = () => {
    setAssociatedPlayer(playerData);
    setModalOpen(true);
  };

  const upperCaseStatus = playerData.vType.charAt(0).toUpperCase() + playerData.vType.slice(1);
  const healthBarSize = Math.max(0, playerData.health);

  return (
    <StyledBox p={1}>
      <div onClick={handlePlayerClick}>
        <Paper className={classes.paper}>
          <Box display="flex" alignItems="center" pb="5px">
            <Box flexGrow={1} display="flex" overflow="hidden">
              <Tooltip
                title={upperCaseStatus}
                placement="top"
                arrow
                classes={{
                  tooltip: classes.tooltipOverride,
                }}
              >
                <span className={classes.icon}>
                  {statusIcon[playerData.vType]}
                </span>
              </Tooltip>
              <Typography
                style={{ marginRight: 5 }}
                variant="subtitle1"
                color="textSecondary"
              >
                {playerData.id}
              </Typography>
              <Typography variant="subtitle1" color="textSecondary">
                |
              </Typography>
              <Typography
                style={{ marginLeft: 5 }}
                noWrap
                variant="subtitle1"
                color="textPrimary"
              >
                {playerData.admin && "🛡️"} {playerData.displayName}
              </Typography>
              <Typography
                style={{ marginLeft: 7, minWidth: "fit-content" }}
                noWrap
                variant="subtitle1"
                color="textSecondary"
              >
                {playerData.dist < 0 ? `?? m` : formatDistance(playerData.dist)}
              </Typography>
            </Box>
          </Box>
          <div>
            <Tooltip
              title={t("nui_menu.page_players.card.health", {
                percentHealth: playerData.health ?? '0',
              })}
              placement="bottom"
              arrow
              classes={{
                tooltip: classes.tooltipOverride,
              }}
            >
              <HealthBarBackground healthVal={playerData.health}>
                <HealthBar
                  width={`${healthBarSize}%`}
                  healthVal={playerData.health}
                />
              </HealthBarBackground>
            </Tooltip>
          </div>
        </Paper>
      </div>
    </StyledBox>
  );
};

export default memo(PlayerCard);
