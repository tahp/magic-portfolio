"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Button, 
  Input, 
  Text, 
  Flex, 
  Column,
  Card 
} from "@once-ui-system/core";

export default function AdminPage() {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  // Content management state
  const [files, setFiles] = useState<{ posts: any[], projects: any[] }>({ posts: [], projects: [] });
  const [editingFile, setEditingFile] = useState<{ type: "blog" | "work", name: string, content: string } | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  
  // Upload state
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function loadAll() {
      try {
        // Load general content
        const contentRes = await fetch("/api/content");
        if (contentRes.status === 401) {
          router.push("/admin/login");
          return;
        }
        if (contentRes.ok) {
          const contentData = await contentRes.json();
          setContent(contentData);
        }

        // Load file list
        const filesRes = await fetch("/api/content/files");
        if (filesRes.ok) {
          const filesData = await filesRes.json();
          setFiles({
            posts: filesData.posts,
            projects: filesData.projects,
          });
        }
      } catch (err) {
        console.error("Admin load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, [router]);

  const handleSaveGeneral = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });

      if (res.ok) {
        alert("Content saved successfully!");
      } else {
        alert("Failed to save content.");
      }
    } catch (err) {
      alert("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const loadFile = async (type: "blog" | "work", name: string) => {
    setFileLoading(true);
    try {
      const res = await fetch(`/api/content/files/${type}/${name}`);
      if (res.ok) {
        const data = await res.json();
        setEditingFile({ type, name, content: data.content });
      }
    } catch (err) {
      alert("Failed to load file content.");
    } finally {
      setFileLoading(false);
    }
  };

  const saveFile = async () => {
    if (!editingFile) return;
    setSaving(true);
    try {
      const res = await fetch("/api/content/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: editingFile.type,
          filename: editingFile.name,
          content: editingFile.content,
        }),
      });

      if (res.ok) {
        alert("File saved successfully!");
        const filesRes = await fetch("/api/content/files");
        const filesData = await filesRes.json();
        setFiles({ posts: filesData.posts, projects: filesData.projects });
      } else {
        alert("Failed to save file.");
      }
    } catch (err) {
      alert("An error occurred while saving file.");
    } finally {
      setSaving(false);
    }
  };

  const deleteFile = async (type: "blog" | "work", name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/content/files/${type}/${name}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("File deleted successfully!");
        const filesRes = await fetch("/api/content/files");
        const filesData = await filesRes.json();
        setFiles({ posts: filesData.posts, projects: filesData.projects });
        if (editingFile?.name === name) setEditingFile(null);
      } else {
        alert("Failed to delete file.");
      }
    } catch (err) {
      alert("An error occurred while deleting.");
    } finally {
      setSaving(false);
    }
  };

  const createNewFile = (type: "blog" | "work") => {
    setEditingFile({
      type,
      name: "",
      content: "# New Content\n\nStart writing here...",
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const newImage = {
          src: data.path,
          alt: file.name,
          orientation: "horizontal",
        };
        const updatedGallery = [...(content.gallery?.images || []), newImage];
        setContent({ ...content, gallery: { ...content.gallery, images: updatedGallery } });
        alert("Image uploaded successfully!");
      } else {
        const errData = await res.json();
        alert(`Upload failed: ${errData.message}`);
      }
    } catch (err) {
      alert("An error occurred while uploading.");
    } finally {
      setUploading(false);
    }
  };

  const applyFormat = (prefix: string, suffix: string = "") => {
    if (!textareaRef.current || !editingFile) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editingFile.content;
    
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);
    
    const newContent = before + prefix + selected + suffix + after;
    setEditingFile({ ...editingFile, content: newContent });
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length + suffix.length);
    }, 0);
  };

  if (loading) return (
    <Flex justify="center" align="center" height="400px" width="100%">
      <Text>Loading admin panel...</Text>
    </Flex>
  );

  if (!content) return (
    <Flex justify="center" align="center" height="400px" width="100%">
      <Text>Failed to load portfolio content. Please check your server logs.</Text>
    </Flex>
  );

  const FileTable = ({ title, data, type }: { title: string, data: any[], type: "blog" | "work" }) => (
    <Column gap="12" width="100%">
      <Text weight="strong">{title}</Text>
      <Flex direction="column" style={{ border: "1px solid var(--neutral-alpha-medium)", borderRadius: "4px", overflow: "hidden" }}>
        <Flex 
          background="neutral-alpha-weak" 
          padding="8" 
          borderBottom="1px solid var(--neutral-alpha-medium)"
        >
          <Text weight="strong" flex={1} size="sm">Filename</Text>
          <Text weight="strong" width="60px" textAlign="center" size="sm">View</Text>
          <Text weight="strong" width="60px" textAlign="center" size="sm">Edit</Text>
          <Text weight="strong" width="60px" textAlign="center" size="sm">Delete</Text>
        </Flex>
        {data.length > 0 ? (
          data.map((file: any) => (
            <Flex 
              key={file.name} 
              padding="8" 
              align="center" 
              style={{ borderBottom: "1px solid var(--neutral-alpha-medium)" }}
            >
              <Text flex={1} size="sm">{file.name}</Text>
              <Flex width="60px" justify="center">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => window.open(`/${type === "blog" ? "blog" : "work"}/${file.name.replace(".mdx", "")}`, "_blank")}
                >
                  View
                </Button>
              </Flex>
              <Flex width="60px" justify="center">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => loadFile(type, file.name)}
                >
                  Edit
                </Button>
              </Flex>
              <Flex width="60px" justify="center">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => deleteFile(type, file.name)}
                >
                  Delete
                </Button>
              </Flex>
            </Flex>
          ))
        ) : (
          <Flex padding="16" justify="center">
            <Text size="sm" onBackground="neutral-medium">No items found.</Text>
          </Flex>
        )}
      </Flex>
    </Column>
  );

  return (
    <Column gap="32" width="100%">
      <Flex justify="space-between" align="center" width="100%">
        <Flex align="center" gap="12">
          <Button 
            variant="secondary" 
            onClick={() => setMenuOpen(!menuOpen)}
            size="sm"
          >
            ☰ Menu
          </Button>
          <Text size="xl" weight="strong">Manage Portfolio</Text>
        </Flex>
        <Button 
          variant="primary" 
          onClick={handleSaveGeneral} 
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </Flex>

      {menuOpen && (
        <Card width="240px" position="absolute" zIndex={10} style={{ marginTop: "-20px" }}>
          <Column gap="4">
            {[
              { id: "profile", label: "Profile & Social" },
              { id: "pages", label: "Page Text" },
              { id: "content", label: "Posts & Projects" },
              { id: "gallery", label: "Gallery" },
            ].map((item) => (
              <Button 
                key={item.id} 
                variant={activeTab === item.id ? "primary" : "ghost"} 
                onClick={() => {
                  setActiveTab(item.id);
                  setMenuOpen(false);
                }}
                width="100%"
                textAlign="left"
              >
                {item.label}
              </Button>
            ))}
          </Column>
        </Card>
      )}

      <Card width="100%">
        <Column gap="24">
          {activeTab === "profile" && (
            <Column gap="16">
              <Text weight="strong" size="lg">Personal Information</Text>
              <Flex gap="12" wrap="wrap">
                <Input 
                  id="admin-first-name"
                  label="First Name" 
                  value={content.person?.firstName || ""} 
                  onChange={(e) => setContent({ ...content, person: { ...content.person, firstName: e.target.value } })}
                  width="50%"
                />
                <Input 
                  id="admin-last-name"
                  label="Last Name" 
                  value={content.person?.lastName || ""} 
                  onChange={(e) => setContent({ ...content, person: { ...content.person, lastName: e.target.value } })}
                  width="50%"
                />
              </Flex>
              <Input 
                id="admin-role"
                label="Role" 
                value={content.person?.role || ""} 
                onChange={(e) => setContent({ ...content, person: { ...content.person, role: e.target.value } })}
                width="100%"
              />
              <Input 
                id="admin-email"
                label="Email" 
                value={content.person?.email || ""} 
                onChange={(e) => setContent({ ...content, person: { ...content.person, email: e.target.value } })}
                width="100%"
              />
              <Input 
                id="admin-location"
                label="Location" 
                value={content.person?.location || ""} 
                onChange={(e) => setContent({ ...content, person: { ...content.person, location: e.target.value } })}
                width="100%"
              />
              <Text weight="strong" size="lg" marginTop="24">Social Links</Text>
              <Column gap="12" width="100%">
                {content.social?.map((link: any, index: number) => (
                  <Flex key={index} gap="12" align="center" width="100%">
                    <Text size="sm" width="100px">{link.name}</Text>
                    <Input 
                      id={`admin-social-${index}`}
                      value={link.link} 
                      onChange={(e) => {
                        const newSocial = [...content.social];
                        newSocial[index].link = e.target.value;
                        setContent({ ...content, social: newSocial });
                      }}
                      width="100%"
                    />
                  </Flex>
                ))}
              </Column>
            </Column>
          )}

          {activeTab === "pages" && (
            <Column gap="24" width="100%">
              <Column gap="16">
                <Text weight="strong" size="lg">Home Page</Text>
                <Input 
                  id="admin-home-headline"
                  label="Headline" 
                  value={content.home?.headline || ""} 
                  onChange={(e) => setContent({ ...content, home: { ...content.home, headline: e.target.value } })}
                  width="100%"
                />
                <Input 
                  id="admin-home-subline"
                  label="Subline" 
                  value={content.home?.subline || ""} 
                  onChange={(e) => setContent({ ...content, home: { ...content.home, subline: e.target.value } })}
                  width="100%"
                />
              </Column>
              <Column gap="16">
                <Text weight="strong" size="lg">About Page</Text>
                <Input 
                  id="admin-about-intro"
                  label="Intro Description" 
                  value={content.about?.intro?.description || ""} 
                  onChange={(e) => setContent({ ...content, about: { ...content.about, intro: { ...content.about.intro, description: e.target.value } } })}
                  width="100%"
                />
              </Column>
            </Column>
          )}

          {activeTab === "content" && (
            <Column gap="24" width="100%">
              {editingFile ? (
                <Column gap="16">
                  <Flex justify="space-between" align="center">
                    <Text weight="strong" size="lg">Editing {editingFile.type}: {editingFile.name}</Text>
                    <Flex gap="12">
                      <Button variant="secondary" onClick={() => setEditingFile(null)}>Cancel</Button>
                      <Button variant="primary" onClick={saveFile} disabled={saving}>Save File</Button>
                    </Flex>
                  </Flex>
                  <Flex vertical="center" gap="4" width="100%">
                    <Text size="sm" weight="strong">Filename (must end in .mdx)</Text>
                    <input 
                      style={{ 
                        width: "100%", 
                        padding: "12px", 
                        borderRadius: "8px", 
                        background: "var(--neutral-alpha-weak)", 
                        color: "var(--neutral-on-background)",
                        fontFamily: "monospace",
                        border: "1px solid var(--neutral-alpha-medium)",
                        boxSizing: "border-box"
                      }}
                      value={editingFile.name} 
                      onChange={(e) => setEditingFile({ ...editingFile, name: e.target.value })}
                    />
                  </Flex>
                  <Column gap="8" width="100%">
                    <Flex gap="8">
                      <Button size="sm" variant="secondary" onClick={() => applyFormat("# ")}>H1</Button>
                      <Button size="sm" variant="secondary" onClick={() => applyFormat("## ")}>H2</Button>
                      <Button size="sm" variant="secondary" onClick={() => applyFormat("**", "**")}>Bold</Button>
                      <Button size="sm" variant="secondary" onClick={() => applyFormat("*", "*")}>Italic</Button>
                      <Button size="sm" variant="secondary" onClick={() => applyFormat("- ")}>List</Button>
                      <Button size="sm" variant="secondary" onClick={() => applyFormat(">", "")}>Quote</Button>
                    </Flex>
                    <textarea 
                      ref={textareaRef}
                      style={{ 
                        width: "100%", 
                        minHeight: "400px", 
                        padding: "12px", 
                        borderRadius: "8px", 
                        background: "var(--neutral-alpha-weak)", 
                        color: "var(--neutral-on-background)",
                        fontFamily: "monospace",
                        border: "1px solid var(--neutral-alpha-medium)",
                        boxSizing: "border-box"
                      }}
                      value={editingFile.content}
                      onChange={(e) => setEditingFile({ ...editingFile, content: e.target.value })}
                    />
                  </Column>
                </Column>
              ) : (
                <>
                  <Flex justify="end" gap="12">
                    <Button variant="secondary" onClick={() => createNewFile("blog")}>+ New Post</Button>
                    <Button variant="secondary" onClick={() => createNewFile("work")}>+ New Project</Button>
                  </Flex>
                  <Column gap="32" width="100%">
                    <FileTable title="Blog Posts" data={files.posts} type="blog" />
                    <FileTable title="Projects" data={files.projects} type="work" />
                  </Column>
                </>
              )}
            </Column>
          )}

          {activeTab === "gallery" && (
            <Column gap="16">
              <Flex justify="space-between" align="center">
                <Text weight="strong" size="lg">Gallery Images</Text>
                <Flex gap="12" align="center">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: "none" }} 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <Button 
                    variant="secondary" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? "Uploading..." : "+ Upload Image"}
                  </Button>
                </Flex>
              </Flex>
              
              <Flex gap="12" align="center" padding="8" background="neutral-alpha-weak" radius="m-4" width="100%">
                <Text size="sm" weight="strong" width="100px">Image</Text>
                <Text size="sm" weight="strong" width="30%">Alt Text</Text>
                <Text size="sm" weight="strong" width="20%">Orientation</Text>
                <Text size="sm" weight="strong" width="100px" textAlign="center">Action</Text>
              </Flex>

              <Column gap="12">
                {content.gallery?.images.map((img: any, index: number) => (
                  <Flex key={index} gap="12" align="center" padding="12" background="neutral-alpha-weak" radius="m-4" width="100%">
                    <Flex width="100px" align="center" justify="center" overflow="hidden" radius="s" background="neutral-alpha-medium" height="40px">
                      <img src={img.src} alt={img.alt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </Flex>
                    <Input 
                      id={`gallery-alt-${index}`}
                      placeholder="Alt Text"
                      value={img.alt} 
                      onChange={(e) => {
                        const updatedImages = [...content.gallery.images];
                        updatedImages[index].alt = e.target.value;
                        setContent({ ...content, gallery: { ...content.gallery, images: updatedImages } });
                      }}
                      width="30%"
                    />
                    <Input 
                      id={`gallery-orientation-${index}`}
                      placeholder="Orientation"
                      value={img.orientation} 
                      onChange={(e) => {
                        const updatedImages = [...content.gallery.images];
                        updatedImages[index].orientation = e.target.value;
                        setContent({ ...content, gallery: { ...content.gallery, images: updatedImages } });
                      }}
                      width="20%"
                    />
                    <Button 
                      variant="secondary" 
                      onClick={() => {
                        const updatedImages = content.gallery.images.filter((_: any, i: number) => i !== index);
                        setContent({ ...content, gallery: { ...content.gallery, images: updatedImages } });
                      }}
                    >
                      Delete
                    </Button>
                  </Flex>
                ))}
                {(!content.gallery?.images || content.gallery.images.length === 0) && (
                  <Text size="sm" onBackground="neutral-medium">No images in gallery.</Text>
                )}
              </Column>
            </Column>
          )}
        </Column>
      </Card>
    </Column>
  );
}
