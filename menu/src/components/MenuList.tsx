import React, {ChangeEvent, useState} from 'react';
import {Box, List, makeStyles, Tab, Tabs} from "@material-ui/core";
import {MenuListItem} from "./MenuListItem";
import {
  LocationSearching,
  AccessibilityNew,
  DirectionsCar,
  Build,
  LocalHospital,
  Announcement
} from "@material-ui/icons"

import { usePageContext } from "../provider/PageProvider";

const useStyles = makeStyles({
  root: {
    background: "#151a1f",
    width: 325,
    borderRadius: 15,
    margin: 10,
    display: 'flex',
    flexDirection: 'column'
  },
  tabRoot: {

  }
})

const MenuList: React.FC = ({}) => {
  const classes = useStyles()

  const [curSelected, setCurSelected] = useState(0)

  const { page, setPage } = usePageContext()

  const handleChange = (event: ChangeEvent<{}>, newValue: number) => {
    setPage(newValue)
  }

  return (
    <Box p={2} className={classes.root}>
      <Box my={1} display='flex' justifyContent='center'>
        <img src='assets/images/txadmin.png' alt='txadmin bro' />
      </Box>
      <Box width='100%'>
        <Tabs
          value={page}
          indicatorColor="primary"
          textColor="secondary"
          onChange={handleChange}
        >
          <Tab label='Main' wrapped />
          <Tab label='Players' wrapped />
          <Tab label='TXAdmin' wrapped />
        </Tabs>
      </Box>
      <List>
        <MenuListItem
          icon={<LocationSearching />}
          primary="Teleport"
          secondary="Teleport with context"
          onSelect={() => console.log('Teleport Clicked')}
        />
        <MenuListItem
          icon={<AccessibilityNew />}
          primary="Player Mode"
          secondary="Current: NoClip"
          onSelect={() => console.log('Player Mode Clicked')}
        />
        <MenuListItem
          icon={<DirectionsCar />}
          primary="Spawn Vehicle"
          secondary="Uses model name"
          onSelect={() => console.log('Spawn Vehicle Clicked')}
        />
        <MenuListItem
          icon={<Build />}
          primary="Fix Vehicle"
          secondary="Set current vehicle health to 100%"
          onSelect={() => console.log('Fix Vehicle Clicked')}
        />
        <MenuListItem
          icon={<LocalHospital />}
          primary="Heal All Players"
          secondary="Will heal all players to full health"
          onSelect={() => console.log('Heal All Clicked')}
        />
        <MenuListItem
          icon={<Announcement />}
          primary="Send Announcement"
          secondary="Announce a message"
          onSelect={() => console.log('Send announcement Clicked')}
        />
      </List>
    </Box>
  );
};

export default MenuList;
