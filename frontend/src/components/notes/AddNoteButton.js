import React from "react";
import { Plus } from "lucide-react";
import Button from "../ui/Button";

const AddNoteButton = ({ onClick, label = "Add Notes" }) => {
  return (
    <Button type="button" size="sm" onClick={onClick}>
      <Plus className="h-4 w-4 mr-1" />
      {label}
    </Button>
  );
};

export default AddNoteButton;
