import React, { useEffect, useMemo, useState } from "react";
import {Box, List, makeStyles, Theme} from "@material-ui/core";
import { MenuListItem, MenuListItemMulti } from "./MenuListItem";
import {
  AccessibilityNew,
  Announcement,
  Build,
  ControlCamera,
  DirectionsCar,
  Favorite,
  GpsFixed,
  LocalHospital,
  LocationSearching,
  Restore,
  Security,
} from "@material-ui/icons";
import { useKeyboardNavigation } from "../../hooks/useKeyboardNavigation";
import { useDialogContext } from "../../provider/DialogProvider";
import { fetchNui } from "../../utils/fetchNui";
import { useKeyboardNavContext } from "../../provider/KeyboardNavProvider";
import { useTranslate } from "react-polyglot";
import { useSnackbar } from "notistack";
import { PlayerMode, usePlayerMode } from "../../state/playermode.state";
import { useIsMenuVisible } from "../../state/visibility.state";
import { TeleportMode, useTeleportMode } from "../../state/teleportmode.state";
import { HealMode, useHealMode } from "../../state/healmode.state";

const fadeHeight = 20;
const listHeight = 388;

const useStyles = makeStyles((theme: Theme) => ({
  list: {
    maxHeight: listHeight,
    overflow: "auto",
    "&::-webkit-scrollbar": {
      display: "none",
    },
  },
  fadeTop: {
    backgroundImage: `linear-gradient(to top, transparent, ${theme.palette.background.default})`,
    position: 'relative',
    bottom: listHeight + fadeHeight - 4, //the 2 comes from the tab selector
    height: fadeHeight,
  },
  fadeBottom: {
    backgroundImage: `linear-gradient(to bottom, transparent, ${theme.palette.background.default})`,
    position: 'relative',
    bottom: fadeHeight*2,
    height: fadeHeight,
  },
  icon: {
    color: theme.palette.text.secondary,
    marginTop: -(fadeHeight*2)
  },
}));

export const MainPageList: React.FC = () => {
  const { openDialog } = useDialogContext();
  const { setDisabledKeyNav } = useKeyboardNavContext();
  const [curSelected, setCurSelected] = useState(0);
  const t = useTranslate();
  const { enqueueSnackbar } = useSnackbar();
  const [playerMode, setPlayerMode] = usePlayerMode();
  const [teleportMode, setTeleportMode] = useTeleportMode();
  const [healMode, setHealMode] = useHealMode();
  const menuVisible = useIsMenuVisible()
  const classes = useStyles();

  // the directions are inverted
  const handleArrowDown = () => {
    const next = curSelected + 1;
    fetchNui('playSound', 'move')
    setCurSelected(next >= menuListItems.length ? 0 : next);
    console.log(next >= menuListItems.length ? 0 : next, menuListItems.length)
  };

  const handleArrowUp = () => {
    const next = curSelected - 1;
    fetchNui('playSound', 'move')
    setCurSelected(next < 0 ? menuListItems.length - 1 : next);
    console.log(next < 0 ? menuListItems.length - 1 : next, menuListItems.length)
  };

  useEffect(() => {
    setDisabledKeyNav(false);
    return () => setDisabledKeyNav(true);
  }, [setDisabledKeyNav]);

  useEffect(() => {
    setCurSelected(0)
  }, [menuVisible])

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
        // Testing examples:
        // {x: -1; y: 2; z:3}
        // {x = -1.01; y= 2.02; z=3.03}
        // -1, 2, 3
        const [x, y, z] = Array.from(
          coords.matchAll(/-?\d{1,4}(?:\.\d{1,9})?/g), 
          m => parseFloat(m[0])
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
    fetchNui("tpBack").then(({e}) => {
      e
        ? enqueueSnackbar(t("nui_menu.page_main.teleport_back.error"), { variant: 'error' })
        : enqueueSnackbar(t("nui_menu.page_main.teleport_back.success"), { variant: 'success' })
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

  const handleSpawnVehicle = () => {
    openDialog({
      description: t("nui_menu.page_main.spawn_veh.dialog_desc"),
      title: t("nui_menu.page_main.spawn_veh.dialog_title"),
      placeholder: "Adder",
      onSubmit: (modelName: string) => {
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
    ].filter(v => !!(v && v.length))
    const msg = messages[Math.round((messages.length-1) * Math.random())]
    enqueueSnackbar(msg, {
      variant: "success",
    });
  }

  const handleSpawnWeapon = () => {
    openDialog({
      title: t("nui_menu.page_main.spawn_wep.dialog_title"),
      placeholder: "WEAPON_ASSAULTRIFLE",
      description: t("nui_menu.page_main.spawn_wep.dialog_desc"),
      onSubmit: (inputValue) => {
        fetchNui("spawnWeapon", inputValue);
      },
    });
  };

  const menuListItems = useMemo(
    () => [
      {
        icon: <AccessibilityNew />,
        primary: t("nui_menu.page_main.player_mode.list_primary"),
        secondary: t("nui_menu.page_main.player_mode.list_secondary", {
          mode: "NoClip",
        }),
        showCurrentPrefix: true,
        isMultiAction: true,
        initialValue: playerMode,
        actions: [
          {
            label: t("nui_menu.page_main.player_mode.item_none"),
            value: PlayerMode.DEFAULT,
            onSelect: () => {
              setPlayerMode(PlayerMode.DEFAULT);
              fetchNui("playerModeChanged", PlayerMode.DEFAULT);
              enqueueSnackbar(t("nui_menu.page_main.player_mode.dialog_success_none"), {
                variant: "success",
              });
            },
          },
          {
            label: t("nui_menu.page_main.player_mode.item_noclip"),
            value: PlayerMode.NOCLIP,
            icon: <ControlCamera />,
            onSelect: () => {
              setPlayerMode(PlayerMode.NOCLIP);
              fetchNui("playerModeChanged", PlayerMode.NOCLIP);
            },
          },
          {
            label: t("nui_menu.page_main.player_mode.item_godmode"),
            value: PlayerMode.GOD_MODE,
            icon: <Security />,
            onSelect: () => {
              setPlayerMode(PlayerMode.GOD_MODE);
              fetchNui("playerModeChanged", PlayerMode.GOD_MODE);
            },
          },
        ],
      },
      {
        icon: <LocationSearching />,
        primary: t("nui_menu.page_main.teleport.list_primary"),
        isMultiAction: true,
        initialValue: teleportMode,
        actions: [
          {
            label: t("nui_menu.page_main.teleport.item_waypoint"),
            value: TeleportMode.WAYPOINT,
            onSelect: () => {
              setTeleportMode(TeleportMode.WAYPOINT);
              fetchNui("tpToWaypoint", {});
            },
            icon: <GpsFixed />
          },
          {
            label: t("nui_menu.page_main.teleport.item_coords"),
            value: TeleportMode.COORDINATES,
            onSelect: () => {
              setTeleportMode(TeleportMode.COORDINATES);
              handleTeleport();
            }
          },
          {
            label: t("nui_menu.page_main.teleport.item_previous"),
            value: TeleportMode.PREVIOUS,
            onSelect: handleTeleportBack,
            icon: <Restore />
          }
        ],
      },
      {
        icon: <DirectionsCar />,
        primary: t("nui_menu.page_main.spawn_veh.list_primary"),
        secondary: t("nui_menu.page_main.spawn_veh.list_secondary"),
        onSelect: handleSpawnVehicle,
      },
      {
        icon: <Build />,
        primary: t("nui_menu.page_main.fix_vehicle.list_primary"),
        secondary: t("nui_menu.page_main.fix_vehicle.list_secondary"),
        onSelect: handleFixVehicle,
      },
      {
        primary: t("nui_menu.page_main.heal_myself.list_primary"),
        isMultiAction: true,
        initialValue: healMode,
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
          }
        ]
      },
      {
        icon: <Announcement />,
        primary: t("nui_menu.page_main.send_announce.list_primary"),
        secondary: t("nui_menu.page_main.send_announce.list_secondary"),
        onSelect: handleAnnounceMessage,
      },
      // {
      //   icon: <Gavel />,
      //   primary: t("nui_menu.page_main.spawn_wep.list_primary"),
      //   secondary: t("nui_menu.page_main.spawn_wep.list_secondary"),
      //   onSelect: handleSpawnWeapon,
      // },
    ],
    []
  );

  return (
    <Box pb={2}>
      <List className={classes.list}>
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
      </List>
      {/*<Box className={classes.fadeTop} style={{opacity: curSelected <= 1 ? 0 : 1}}/>*/}
      {/*<Box className={classes.fadeBottom} style={{opacity: curSelected >= 6 ? 0 : 1}}/>*/}
      {
      /*
        This arrow was used for a scrollable main item list, if it becomes scrollable again
        reuse this
      */
      /*<Box className={classes.icon} display="flex" justifyContent="center">*/
      /*  <ExpandMore />*/
      /*</Box>*/
      }
    </Box>
  );
};
