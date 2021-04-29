import React from "react";
import { Box, makeStyles, Theme } from "@material-ui/core";
import { txAdminMenuPage, usePageContext } from "../provider/PageProvider";


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
  const { page } = usePageContext()

  const isCurrentPage = page === txAdminMenuPage.Players

  return isCurrentPage && (
    <Box className={classes.root} mt={4} mb={10}>

    </Box>
  )
}