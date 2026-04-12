import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "../../lib/supabase";
import { createSlug } from "../../lib/cms";
import type { CmsContributor } from "../../types/database";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";

interface AuthorCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (author: CmsContributor) => void;
}

const contributorTypes = [
  { value: "staff", label: "Staff" },
  { value: "student", label: "Student" },
  { value: "guest", label: "Guest" },
  { value: "faculty", label: "Faculty" },
  { value: "alumni", label: "Alumni" },
];

export function AuthorCreateDialog({
  isOpen,
  onClose,
  onCreated,
}: AuthorCreateDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [type, setType] = useState("staff");

  const resetForm = () => {
    setDisplayName("");
    setEmail("");
    setBio("");
    setType("staff");
  };

  const handleClose = () => {
    if (isSaving) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!displayName.trim()) {
      toast.error("Author name is required.");
      return;
    }

    setIsSaving(true);

    const payload = {
      display_name: displayName.trim(),
      slug: createSlug(displayName),
      email: email.trim() || null,
      contributor_type: type,
      bio: bio.trim() || null,
      is_active: true,
      is_public: true,
    };

    const { data, error } = await supabase
      .from("contributors")
      .insert(payload)
      .select("id, display_name, slug, email, contributor_type, is_active")
      .single();

    setIsSaving(false);

    if (error || !data) {
      toast.error(error?.message ?? "Unable to create author.");
      return;
    }

    toast.success("Author created.");
    onCreated(data as CmsContributor);
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-emerald-900">Create Author</DialogTitle>
          <DialogDescription>
            Add a contributor so articles can be properly credited in the dashboard.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="author-name">Display Name</Label>
              <Input
                id="author-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Anna Marie Naagas"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author-email">Email</Label>
              <Input
                id="author-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="author@vsu.edu.ph"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="author-type">Contributor Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="author-type">
                <SelectValue placeholder="Select a contributor type" />
              </SelectTrigger>
              <SelectContent>
                {contributorTypes.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="author-bio">Bio</Label>
            <Textarea
              id="author-bio"
              rows={4}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="Short public bio for the contributor."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-emerald-700 text-white hover:bg-emerald-800"
              disabled={isSaving}
            >
              {isSaving ? "Creating..." : "Create Author"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
