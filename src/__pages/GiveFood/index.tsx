import React, { useState } from "react";
import AddButton from "components/Buttons/AddButton";
import { Dialog } from "@material-ui/core";
import { withFirebase } from "components/Firebase";
import NewOfferDialog from "__dialogs/NewOfferDialog";
import YourOffers from "components/YourOffers";

const GiveFoodPage: React.FC<any> = () => {
  const [open, setOpen] = useState(false);

  const handleDialogOpen = () => {
    setOpen(true);
  };

  const handleDialogClose = () => {
    setOpen(false);
  };

  return (
    <div>
      <AddButton onClick={handleDialogOpen} />
      <WrappedYourOffers />
      <Dialog
        open={open}
        keepMounted
        fullWidth
        onClose={handleDialogClose}
        aria-labelledby="alert-dialog-slide-title"
        aria-describedby="alert-dialog-slide-description"
      >
        <WrappedNewOfferDialog closeDialog={handleDialogClose} />
      </Dialog>
    </div>
  );
};

const WrappedNewOfferDialog = withFirebase(NewOfferDialog);
const WrappedYourOffers = withFirebase(YourOffers);

export default GiveFoodPage;
