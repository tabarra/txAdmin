import React from "react";
import { Box, makeStyles, Theme } from "@material-ui/core";
import {usePageValue, txAdminMenuPage} from "../atoms/page.atom";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    backgroundColor: theme.palette.background.default,
    flexGrow: 1,
    borderRadius: 15,
  },
  overrideWrapper: {
    display: 'flex'
  }
}))

export const PlayersPage: React.FC = () => {
  const classes = useStyles()
  const page = usePageValue()

  const isCurrentPage = page === txAdminMenuPage.Players

  return isCurrentPage && (
    <Box className={classes.root} mt={2} mb={10}>

    </Box>
  )
}