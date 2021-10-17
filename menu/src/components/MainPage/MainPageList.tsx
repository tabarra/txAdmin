import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, List, styled, Theme } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import { MenuListItem, MenuListItemMulti } from "./MenuListItem";
import {
  AccessibilityNew,
  Announcement,
  Build,
  ClearAll,
  ControlCamera,
  DirectionsCar,
  ExpandMore,
  Favorite,
  FileCopy,
  GpsFixed,
  LocalHospital,
  LocationSearching,
  PermIdentity,
  Restore,
  Security,
} from "@mui/icons-material";
import { useKeyboardNavigation } from "../../hooks/useKeyboardNavigation";
import { useDialogContext } from "../../provider/DialogProvider";
import { fetchNui } from "../../utils/fetchNui";
import { useTranslate } from "react-polyglot";
import { useSnackbar } from "notistack";
import { PlayerMode, usePlayerMode } from "../../state/playermode.state";
import { useIsMenuVisibleValue } from "../../state/visibility.state";
import { TeleportMode, useTeleportMode } from "../../state/teleportmode.state";
import { HealMode, useHealMode } from "../../state/healmode.state";
import { arrayRandom } from "../../utils/miscUtils";
import { copyToClipboard } from "../../utils/copyToClipboard";
import { useServerCtxValue } from "../../state/server.state";
import { VehicleMode, useVehicleMode } from "../../state/vehiclemode.state";

const fadeHeight = 20;
const listHeight = 388;

const BoxFadeTop = styled(Box)(({ theme }) => ({
  backgroundImage: `linear-gradient(to top, transparent, ${theme.palette.background.default})`,
  position: "relative",
  bottom: listHeight + fadeHeight - 4,
  height: fadeHeight,
}));

const BoxFadeBottom = styled(Box)(({ theme }) => ({
  backgroundImage: `linear-gradient(to bottom, transparent, ${theme.palette.background.default})`,
  position: "relative",
  height: fadeHeight,
  bottom: fadeHeight * 2,
}));

const BoxIcon = styled(Box)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginTop: -(fadeHeight * 2),
  display: "flex",
  justifyContent: "center",
}));

const StyledList = styled(List)({
  maxHeight: listHeight,
  overflow: "auto",
  "&::-webkit-scrollbar": {
    display: "none",
  },
});

// TODO: This component is kinda getting out of hand, might want to split it somehow
export const MainPageList: React.FC = () => {
  const { openDialog } = useDialogContext();
  const [curSelected, setCurSelected] = useState(0);
  const t = useTranslate();
  const { enqueueSnackbar } = useSnackbar();
  const [playerMode, setPlayerMode] = usePlayerMode();
  const [teleportMode, setTeleportMode] = useTeleportMode();
  const [healMode, setHealMode] = useHealMode();
  const [vehicleMode, setVehicleMode] = useVehicleMode();
  const serverCtx = useServerCtxValue();
  const menuVisible = useIsMenuVisibleValue();

  // the directions are inverted
  const handleArrowDown = useCallback(() => {
    const next = curSelected + 1;
    fetchNui("playSound", "move");
    setCurSelected(next >= menuListItems.length ? 0 : next);
  }, [curSelected]);

  const handleArrowUp = useCallback(() => {
    const next = curSelected - 1;
    fetchNui("playSound", "move");
    setCurSelected(next < 0 ? menuListItems.length - 1 : next);
  }, [curSelected]);

  useEffect(() => {
    setCurSelected(0);
  }, [menuVisible]);

  useKeyboardNavigation({
    onDownDown: handleArrowDown,
    onUpDown: handleArrowUp,
    disableOnFocused: true,
  });

  const handleTeleport = () => {
    openDialog({
      description: t("nui_menu.page_main.teleport.dialog_desc"),
      title: t("nui_menu.page_main.teleport.dialog_title"),
      placeholder: "340, 480, 12",
      onSubmit: (coords: string) => {
        // TODO: accept X, Y and calculate Z
        // TODO: accept heading
        // Testing examples:
        // {x: -1; y: 2; z:3}
        // {x = -1.01; y= 2.02; z=3.03}
        // -1, 2, 3
        const [x, y, z] = Array.from(
          coords.matchAll(/-?\d{1,4}(?:\.\d{1,9})?/g),
          (m) => parseFloat(m[0])
        );

        if ([x, y, z].every((n) => typeof n === "number")) {
          enqueueSnackbar(t("nui_menu.page_main.teleport.dialog_success"), {
            variant: "success",
          });
          fetchNui("tpToCoords", { x, y, z });
        } else {
          enqueueSnackbar(t("nui_menu.page_main.teleport.dialog_error"), {
            variant: "error",
          });
        }
      },
    });
  };

  const handleTeleportBack = () => {
    fetchNui("tpBack").then(({ e }) => {
      e
        ? enqueueSnackbar(t("nui_menu.page_main.teleport_back.error"), {
            variant: "error",
          })
        : enqueueSnackbar(t("nui_menu.page_main.teleport_back.success"), {
            variant: "success",
          });
    });
  };

  const handleAnnounceMessage = () => {
    openDialog({
      description: t("nui_menu.page_main.send_announce.dialog_desc"),
      title: t("nui_menu.page_main.send_announce.dialog_title"),
      placeholder: "Your announcement...",
      onSubmit: (message: string) => {
        // Post up to client with announcement message
        enqueueSnackbar(t("nui_menu.page_main.send_announce.dialog_success"), {
          variant: "success",
        });
        fetchNui("sendAnnouncement", { message });
      },
    });
  };

  const handleTogglePlayerIds = () => {
    fetchNui("togglePlayerIDs").then(({ isShowing }) => {
      isShowing
        ? enqueueSnackbar(t("nui_menu.page_main.player_ids.alert_show"), {
            variant: "info",
          })
        : enqueueSnackbar(t("nui_menu.page_main.player_ids.alert_hide"), {
            variant: "info",
          });
    });
  };

  const handleSpawnVehicle = () => {
    // Since we depend on server side gamestate awareness
    // we disable this function from being used if onesync
    // isn't on
    if (!serverCtx.oneSync.status) {
      return enqueueSnackbar(
        t("nui_menu.page_main.car_options.onesync_error"),
        { variant: "error" }
      );
    }

    openDialog({
      description: t("nui_menu.page_main.spawn_veh.dialog_desc"),
      title: t("nui_menu.page_main.spawn_veh.dialog_title"),
      placeholder: "car, bike, heli, boat, Adder, Buzzard, etc",
      onSubmit: (modelName: string) => {
        modelName = modelName.trim().toLowerCase();
        if (modelName === "car") {
          modelName =
            Math.random() < 0.05
              ? "caddy"
              : arrayRandom([
                  "comet2",
                  "coquette",
                  "trophytruck",
                  "issi5",
                  "f620",
                  "nero",
                  "sc1",
                  "toros",
                  "tyrant",
                ]);
        } else if (modelName === "bike") {
          modelName =
            Math.random() < 0.05
              ? "bmx"
              : arrayRandom(["esskey", "nemesis", "sanchez"]);
        } else if (modelName === "heli") {
          modelName =
            Math.random() < 0.05
              ? "havok"
              : arrayRandom(["buzzard2", "volatus"]);
        } else if (modelName === "boat") {
          modelName =
            Math.random() < 0.05
              ? "seashark"
              : arrayRandom(["dinghy", "toro2"]);
        }
        fetchNui("spawnVehicle", { model: modelName }).then(({ e }) => {
          e
            ? enqueueSnackbar(
                t("nui_menu.page_main.spawn_veh.dialog_error", { modelName }),
                { variant: "error" }
              )
            : enqueueSnackbar(
                t("nui_menu.page_main.spawn_veh.dialog_success"),
                { variant: "success" }
              );
        });
      },
    });
  };

  const handleDeleteVehicle = () => {
    // If onesync is disabled, show an error due to server side entity handling
    if (!serverCtx.oneSync.status) {
      return enqueueSnackbar(
        t("nui_menu.page_main.car_options.onesync_error"),
        { variant: "error" }
      );
    }

    fetchNui("deleteVehicle").then(({ e }) => {
      if (e) {
        return enqueueSnackbar(
          t("nui_menu.page_main.delete_veh.dialog_error"),
          {
            variant: "error",
          }
        );
      }

      enqueueSnackbar(t("nui_menu.page_main.delete_veh.dialog_success"), {
        variant: "info",
      });
    });
  };

  const handleFixVehicle = () => {
    fetchNui("fixVehicle").then(({ e }) => {
      if (e) {
        return enqueueSnackbar(
          t("nui_menu.page_main.fix_vehicle.dialog_error"),
          {
            variant: "error",
          }
        );
      }

      enqueueSnackbar(t("nui_menu.page_main.fix_vehicle.dialog_success"), {
        variant: "info",
      });
    });
  };

  const handleHealAllPlayers = () => {
    fetchNui("healAllPlayers");
    enqueueSnackbar(t("nui_menu.page_main.heal_all.dialog_success"), {
      variant: "info",
    });
  };

  const handleHealMyself = () => {
    fetchNui("healMyself");
    const messages = [
      t("nui_menu.page_main.heal_myself.dialog_success_0"),
      t("nui_menu.page_main.heal_myself.dialog_success_1"),
      t("nui_menu.page_main.heal_myself.dialog_success_2"),
      t("nui_menu.page_main.heal_myself.dialog_success_3"),
    ].filter((v) => !!(v && v.length));
    const msg = messages[Math.round((messages.length - 1) * Math.random())];
    enqueueSnackbar(msg, {
      variant: "success",
    });
  };

  const handlePlayermodeToggle = (targetMode) => {
    if (targetMode === playerMode || targetMode === PlayerMode.DEFAULT) {
      setPlayerMode(PlayerMode.DEFAULT);
      fetchNui("playerModeChanged", PlayerMode.DEFAULT);
      enqueueSnackbar(t("nui_menu.page_main.player_mode.dialog_success_none"), {
        variant: "success",
      });
    } else {
      setPlayerMode(targetMode);
      fetchNui("playerModeChanged", targetMode);
    }
  };

  const handleCopyCoords = () => {
    fetchNui<{ coords: string }>("copyCurrentCoords").then(({ coords }) => {
      copyToClipboard(coords);
      enqueueSnackbar(t("nui_menu.common.copied"), { variant: "success" });
    });
  };

  const handleClearArea = () => {
    openDialog({
      title: t("nui_menu.page_main.clear_area.list_primary"),
      description: t("nui_menu.page_main.clear_area.dialog_description"),
      placeholder: "300",
      onSubmit: (msg) => {
        const parsedRadius = parseInt(msg);

        if (isNaN(parsedRadius) || parsedRadius > 300 || parsedRadius < 0) {
          return enqueueSnackbar(
            t("nui_menu.page_main.clear_area.dialog_error"),
            { variant: "error" }
          );
        }

        fetchNui("clearArea", parsedRadius).then(() => {
          enqueueSnackbar(
            t("nui_menu.page_main.clear_area.dialog_success", {
              radius: parsedRadius,
            }),
            {
              variant: "success",
            }
          );
        });
      },
    });
  };

  // This is here for when I am bored developing
  // const handleSpawnWeapon = () => {
  //   openDialog({
  //     title: t("nui_menu.page_main.spawn_wep.dialog_title"),
  //     placeholder: "WEAPON_ASSAULTRIFLE",
  //     description: t("nui_menu.page_main.spawn_wep.dialog_desc"),
  //     onSubmit: (inputValue) => {
  //       fetchNui("spawnWeapon", inputValue);
  //     },
  //   });
  // };

  // This is where we keep a memoized list of all actions, can be dynamically
  // set in the future for third party resource integration. For now here for
  // simplicity
  const menuListItems = useMemo(
    () => [
      {
        icon: <AccessibilityNew />,
        primary: t("nui_menu.page_main.player_mode.list_primary"),
        secondary: t("nui_menu.page_main.player_mode.list_secondary", {
          mode: "NoClip",
        }),
        requiredPermission: "players.playermode",
        showCurrentPrefix: true,
        isMultiAction: true,
        initialValue: playerMode,
        actions: [
          {
            label: t("nui_menu.page_main.player_mode.item_noclip"),
            value: PlayerMode.NOCLIP,
            icon: <ControlCamera />,
            onSelect: () => {
              handlePlayermodeToggle(PlayerMode.NOCLIP);
            },
          },
          {
            label: t("nui_menu.page_main.player_mode.item_godmode"),
            value: PlayerMode.GOD_MODE,
            icon: <Security />,
            onSelect: () => {
              handlePlayermodeToggle(PlayerMode.GOD_MODE);
            },
          },
          {
            label: t("nui_menu.page_main.player_mode.item_none"),
            value: PlayerMode.DEFAULT,
            onSelect: () => {
              handlePlayermodeToggle(PlayerMode.DEFAULT);
            },
          },
        ],
      },
      {
        icon: <LocationSearching />,
        primary: t("nui_menu.page_main.teleport.list_primary"),
        isMultiAction: true,
        requiredPermission: "players.teleport",
        initialValue: teleportMode,
        actions: [
          {
            label: t("nui_menu.page_main.teleport.item_waypoint"),
            value: TeleportMode.WAYPOINT,
            onSelect: () => {
              setTeleportMode(TeleportMode.WAYPOINT);
              fetchNui("tpToWaypoint", {});
            },
            icon: <GpsFixed />,
          },
          {
            label: t("nui_menu.page_main.teleport.item_coords"),
            value: TeleportMode.COORDINATES,
            onSelect: () => {
              setTeleportMode(TeleportMode.COORDINATES);
              handleTeleport();
            },
          },
          {
            label: t("nui_menu.page_main.teleport.item_previous"),
            value: TeleportMode.PREVIOUS,
            onSelect: handleTeleportBack,
            icon: <Restore />,
          },
        ],
      },
      {
        icon: <DirectionsCar />,
        primary: t("nui_menu.page_main.car_options.list_primary"),
        isMultiAction: true,
        requiredPermission: "menu.vehicle",
        initialValue: vehicleMode,
        actions: [
          {
            label: t("nui_menu.page_main.spawn_veh.list_secondary"),
            value: VehicleMode.SPAWN,
            onSelect: () => {
              setVehicleMode(VehicleMode.SPAWN);
              handleSpawnVehicle();
            },
            icon: <DirectionsCar />,
          },
          {
            label: t("nui_menu.page_main.delete_veh.list_secondary"),
            value: VehicleMode.DELETE,
            onSelect: () => {
              setVehicleMode(VehicleMode.DELETE);
              handleDeleteVehicle();
            },
            icon: <DirectionsCar />,
          },
        ],
      },
      {
        icon: <Build />,
        primary: t("nui_menu.page_main.fix_vehicle.list_primary"),
        secondary: t("nui_menu.page_main.fix_vehicle.list_secondary"),
        requiredPermission: "menu.vehicle",
        onSelect: handleFixVehicle,
      },
      {
        primary: t("nui_menu.page_main.heal_myself.list_primary"),
        isMultiAction: true,
        initialValue: healMode,
        requiredPermission: "players.heal",
        actions: [
          {
            label: t("nui_menu.page_main.heal_myself.list_secondary"),
            value: HealMode.SELF,
            icon: <Favorite />,
            onSelect: () => {
              setHealMode(HealMode.SELF);
              handleHealMyself();
            },
          },
          {
            primary: t("nui_menu.page_main.heal_all.list_primary"),
            label: t("nui_menu.page_main.heal_all.list_secondary"),
            value: HealMode.ALL,
            icon: <LocalHospital />,
            onSelect: () => {
              setHealMode(HealMode.ALL);
              handleHealAllPlayers();
            },
          },
        ],
      },
      {
        icon: <Announcement />,
        requiredPermission: "players.message",
        primary: t("nui_menu.page_main.send_announce.list_primary"),
        secondary: t("nui_menu.page_main.send_announce.list_secondary"),
        onSelect: handleAnnounceMessage,
      },
      {
        icon: <PermIdentity />,
        primary: t("nui_menu.page_main.player_ids.list_primary"),
        secondary: t("nui_menu.page_main.player_ids.list_secondary"),
        onSelect: handleTogglePlayerIds,
      },
      {
        icon: <FileCopy />,
        primary: t("nui_menu.page_main.copy_coords.list_primary"),
        secondary: t("nui_menu.page_main.copy_coords.list_secondary"),
        onSelect: handleCopyCoords,
      },
      {
        icon: <ClearAll />,
        primary: t("nui_menu.page_main.clear_area.list_primary"),
        secondary: t("nui_menu.page_main.clear_area.list_secondary"),
        onSelect: handleClearArea,
        requiredPermission: "menu.clear_area",
      },
      // {
      //   icon: <Gavel />,
      //   primary: t("nui_menu.page_main.spawn_wep.list_primary"),
      //   secondary: t("nui_menu.page_main.spawn_wep.list_secondary"),
      //   onSelect: handleSpawnWeapon,
      // },
    ],
    [playerMode]
  );

  return (
    // add pb={2} if we don't have that arrow at the bottom
    <Box>
      <StyledList>
        {menuListItems.map((item, index) =>
          item.isMultiAction ? (
            // @ts-ignore
            <MenuListItemMulti
              key={index}
              selected={curSelected === index}
              {...item}
            />
          ) : (
            // @ts-ignore
            <MenuListItem
              key={index}
              selected={curSelected === index}
              {...item}
            />
          )
        )}
      </StyledList>
      <BoxFadeTop style={{ opacity: curSelected <= 1 ? 0 : 1 }} />
      <BoxFadeBottom style={{ opacity: curSelected >= 6 ? 0 : 1 }} />
      <BoxIcon display="flex" justifyContent="center">
        <ExpandMore />
      </BoxIcon>
      {/* <Typography
        color="textSecondary"
        style={{
          fontWeight: 500,
          marginTop: -20,
          textAlign: "left",
          fontSize: 12,
        }}
      >
        v{serverCtx.txAdminVersion}
      </Typography>  */}
    </Box>
  );
};
