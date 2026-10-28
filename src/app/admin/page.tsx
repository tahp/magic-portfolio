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

// Local Notification Component
const Notification = ({ message, type, onClose }: { message: string, type: "success" | "error", onClose: () => void }) => (
  <Flex 
    position="fixed" 
    bottom="24" 
    right="24" 
    zIndex={100} 
    padding="12" 
    radius="m" 
    background={type === "success" ? "brand-strong" : "neutral-strong"} 
    color="white" 
    gap="12" 
    align="center"
    style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}
  >
    <Text size="sm">{message}</Text>
    <Button variant="ghost" size="sm" onClick={onClose} style={{ color: "white" }}>✕</Button>
  </Flex>
);

export default function AdminPage() {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  // Notification state
  const [notification, setNotification] = useState<{ message: string, type: "success" | "error" } | null>(null);

  // Content management state
  const [files, setFiles] = useState<{ posts: any[], projects: any[] }>({ posts: [], projects: [] });
  const [editingFile, setEditingFile] = useState<{ type: "blog" | "work", name: string, content: string } | null>(null);
  
  // Upload state
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    async function loadAll() {
      try {
        const contentRes = await fetch("/api/content");
        if (contentRes.status === 401) {
          router.push("/admin/login");
          return;
        }
        if (contentRes.ok) {
          const contentData = await contentRes.json();
          setContent(contentData);
        }

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
    return () => window.removeEventListener("resize", handleResize);
  }, [router]);

  const notify = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSaveGeneral = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });

      if (res.ok) {
        notify("Portfolio content updated successfully");
      } else {
        notify("Failed to save content", "error");
      }
    } catch (err) {
      notify("An error occurred while saving", "error");
    } finally {
      setSaving(false);
    }
  };

  const loadFile = async (type: "blog" | "work", name: string) => {
    try {
      const res = await fetch(`/api/content/files/${type}/${name}`);
      if (res.ok) {
        const data = await res.json();
        setEditingFile({ type, name, content: data.content });
      } else {
        notify("Failed to load file content", "error");
      }
    } catch (err) {
      notify("An error occurred while loading file", "error");
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
        notify("File saved successfully");
        const filesRes = await fetch("/api/content/files");
        const filesData = await filesRes.json();
        setFiles({ posts: filesData.posts, projects: filesData.projects });
      } else {
        notify("Failed to save file", "error");
      }
    } catch (err) {
      notify("An error occurred while saving file", "error");
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
        notify("File deleted successfully");
        const filesRes = await fetch("/api/content/files");
        const filesData = await filesRes.json();
        setFiles({ posts: filesData.posts, projects: filesData.projects });
        if (editingFile?.name === name) setEditingFile(null);
      } else {
        notify("Failed to delete file", "error");
      }
    } catch (err) {
      notify("An error occurred while deleting", "error");
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
          orientation: "landscape",
        };
        const updatedGallery = [...(content.gallery?.images || []), newImage];
        setContent({ ...content, gallery: { ...content.gallery, images: updatedGallery } });
        notify("Image uploaded successfully");
      } else {
        const errData = await res.json();
        notify(`Upload failed: ${errData.message}`, "error");
      }
    } catch (err) {
      notify("An error occurred while uploading", "error");
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
    <Flex justify="center" align="center" height="100vh" width="100%">
      <Column align="center" gap="16">
        <Text size="xl" weight="strong">Loading Studio...</Text>
        <Text size="sm" onBackground="neutral-medium">Preparing your workspace</Text>
      </Column>
    </Flex>
  );

  if (!content) return (
    <Flex justify="center" align="center" height="100vh" width="100%">
      <Text>Failed to load portfolio content. Please check your server logs.</Text>
    </Flex>
  );

  const FileTable = ({ title, data, type }: { title: string, data: any[], type: "blog" | "work" }) => (
    <Column gap="16" width="100%">
      <Text weight="strong" size="lg">{title}</Text>
      <Flex direction="column" style={{ border: "1px solid var(--neutral-alpha-medium)", borderRadius: "8px", overflow: "hidden", width: "100%" }}>
        <Flex 
          background="neutral-alpha-weak" 
          padding="12" 
          borderBottom="1px solid var(--neutral-alpha-medium)"
          style={{ display: "none", sm: { display: "flex" } }}
        >
          <Text weight="strong" flex={1} size="sm">Filename</Text>
          <Text weight="strong" width="80px" textAlign="center" size="sm">View</Text>
          <Text weight="strong" width="80px" textAlign="center" size="sm">Edit</Text>
          <Text weight="strong" width="80px" textAlign="center" size="sm">Delete</Text>
        </Flex>
        {data.length > 0 ? (
          data.map((file: any) => (
            <Flex 
              key={file.name} 
              padding="12" 
              align="center" 
              style={{ borderBottom: "1px solid var(--neutral-alpha-medium)", width: "100%" }}
            >
              <Text flex={1} size="sm" style={{ wordBreak: "break-all" }}>{file.name}</Text>
              <Flex width="80px" justify="center">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => window.open(`/${type === "blog" ? "blog" : "work"}/${file.name.replace(".mdx", "")}`, "_blank")}
                >
                  View
                </Button>
              </Flex>
              <Flex width="80px" justify="center">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => loadFile(type, file.name)}
                >
                  Edit
                </Button>
              </Flex>
              <Flex width="80px" justify="center">
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
          <Flex padding="32" justify="center" width="100%">
            <Text size="sm" onBackground="neutral-medium">No items found.</Text>
          </Flex>
        )}
      </Flex>
    </Column>
  );

  return (
    <Flex 
      width="100%" 
      height="100vh" 
      position="relative"
      style={{ 
        backgroundImage: "url('/images/admin-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        backgroundRepeat: "no-repeat"
      }}
    >
      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}

      {/* Mobile Top Bar */}
      {isMobile && (
        <Flex 
          position="fixed" 
          top="0" 
          left="0" 
          right="0" 
          height="64px" 
          background="neutral-alpha-weak" 
          padding="0 24" 
          align="center" 
          justify="space-between" 
          zIndex={50} 
          borderBottom="1px solid var(--neutral-alpha-medium)"
        >
          <Flex align="center" gap="12">
            <Button 
              variant="secondary" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              size="sm"
            >
              ☰
            </Button>
            <Text weight="strong">Studio</Text>
          </Flex>
          <Button 
            variant="primary" 
            onClick={handleSaveGeneral} 
            disabled={saving}
            size="sm"
          >
            Save
          </Button>
        </Flex>
      )}

      {/* Sidebar Navigation */}
      <Column 
        width="260px" 
        background="neutral-alpha-weak" 
        padding="24" 
        gap="32" 
        borderRight="1px solid var(--neutral-alpha-medium)"
        style={{ 
          height: "100%", 
          position: isMobile ? "fixed" : "sticky", 
          top: 0,
          left: 0,
          zIndex: 60,
          transition: "transform 0.3s ease",
          transform: isMobile && !isMobileMenuOpen ? "translateX(-100%)" : "translateX(0)",
          boxShadow: isMobile && isMobileMenuOpen ? "10px 0 15px rgba(0,0,0,0.1)" : "none",
        }}
      >
        <Column gap="8">
          <Text size="lg" weight="strong">Portfolio Studio</Text>
          <Text size="sm" onBackground="neutral-medium">Control Center</Text>
        </Column>

        <Column gap="8">
          {[
            { id: "profile", label: "Account info" },
            { id: "pages", label: "Site Info" },
            { id: "content", label: "Posts & Projects" },
            { id: "gallery", label: "Gallery" },
          ].map((item) => (
            <Button 
              key={item.id} 
              variant={activeTab === item.id ? "primary" : "ghost"} 
              onClick={() => {
                setActiveTab(item.id);
                if (isMobile) setIsMobileMenuOpen(false);
              }}
              width="100%"
              textAlign="left"
              padding="12"
            >
              {item.label}
              {activeTab === item.id && <Text size="xs" marginLeft="auto">✓</Text>}
            </Button>
          ))}
        </Column>

        <Column gap="12" style={{ marginTop: "auto" }}>
          {!isMobile && (
            <Button 
              variant="primary" 
              onClick={handleSaveGeneral} 
              disabled={saving}
              width="100%"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          )}
          <Text size="xs" textAlign="center" onBackground="neutral-medium">
            v2.3.0 Studio
          </Text>
        </Column>
      </Column>

      {/* Overlay for mobile menu */}
      {isMobile && isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          style={{ 
            position: "fixed", 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: "rgba(0,0,0,0.5)", 
            zIndex: 55 
          }} 
        />
      )}

      {/* Main Content Area */}
      <Column 
        flex={1} 
        padding={isMobile ? "24" : "40"} 
        gap="32" 
        style={{ 
          overflowY: "auto", 
          height: "100vh", 
          paddingTop: isMobile ? "88px" : "40px" 
        }}
      >
        {!isMobile && (
          <Flex justify="space-between" align="center" width="100%">
            <Column gap="4">
              <Text size="xl" weight="strong">
                { [
                  { id: "profile", label: "Account Info" },
                  { id: "pages", label: "Site Information" },
                  { id: "content", label: "Content Management" },
                  { id: "gallery", label: "Media Gallery" },
                ].find(t => t.id === activeTab)?.label }
              </Text>
              <Text size="sm" onBackground="neutral-medium">
                Manage your portfolio's { activeTab === "profile" ? "personal details" : activeTab === "pages" ? "static content" : activeTab === "content" ? "posts and projects" : "images" }.
              </Text>
            </Column>
          </Flex>
        )}

        <Column gap="24" width="100%">
          {activeTab === "profile" && (
            <Column gap="24" width="100%">
              <Card width="100%" style={{ padding: "24px" }}>
                <Column gap="20">
                  <Text weight="strong" size="lg">Personal Information</Text>
                  <Flex gap="16" wrap="wrap" width="100%">
                    <Input 
                      id="admin-first-name"
                      label="First Name" 
                      value={content.person?.firstName || ""} 
                      onChange={(e) => setContent({ ...content, person: { ...content.person, firstName: e.target.value } })}
                      width={isMobile ? "100%" : "50%"}
                    />
                    <Input 
                      id="admin-last-name"
                      label="Last Name" 
                      value={content.person?.lastName || ""} 
                      onChange={(e) => setContent({ ...content, person: { ...content.person, lastName: e.target.value } })}
                      width={isMobile ? "100%" : "50%"}
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
                </Column>
              </Card>

              <Card width="100%" style={{ padding: "24px" }}>
                <Column gap="20">
                  <Text weight="strong" size="lg">Social Links</Text>
                  <Column gap="12" width="100%">
                    {content.social?.map((link: any, index: number) => (
                      <Flex key={index} gap="16" align="center" width="100%">
                        <Text size="sm" weight="strong" width={isMobile ? "auto" : "100px"}>{link.name}</Text>
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
              </Card>
            </Column>
          )}

          {activeTab === "pages" && (
            <Column gap="24" width="100%">
              <Card width="100%" style={{ padding: "24px" }}>
                <Column gap="20">
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
              </Card>

              <Card width="100%" style={{ padding: "24px" }}>
                <Column gap="20">
                  <Text weight="strong" size="lg">About Page</Text>
                  <Input 
                    id="admin-about-intro"
                    label="Intro Description" 
                    value={content.about?.intro?.description || ""} 
                    onChange={(e) => setContent({ ...content, about: { ...content.about, intro: { ...content.about.intro, description: e.target.value } } })}
                    width="100%"
                  />
                </Column>
              </Card>
            </Column>
          )}

          {activeTab === "content" && (
            <Column gap="24" width="100%">
              {editingFile ? (
                <Card width="100%" style={{ padding: "24px" }}>
                  <Column gap="20">
                    <Flex justify="space-between" align="center" width="100%">
                      <Flex align="center" gap="8">
                        <Button variant="ghost" size="sm" onClick={() => setEditingFile(null)}>← Back</Button>
                        <Text weight="strong" size="lg">Editing {editingFile.type === "blog" ? "Post" : "Project"}</Text>
                      </Flex>
                      <Button variant="primary" onClick={saveFile} disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                      </Button>
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
                    <Column gap="12" width="100%">
                      <Flex gap="8" padding="8" background="neutral-alpha-weak" radius="m" align="center" wrap="wrap">
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
                          minHeight: "500px", 
                          padding: "16px", 
                          borderRadius: "8px", 
                          background: "var(--neutral-alpha-weak)", 
                          color: "var(--neutral-on-background)",
                          fontFamily: "monospace",
                          border: "1px solid var(--neutral-alpha-medium)",
                          boxSizing: "border-box",
                          fontSize: "14px",
                          lineHeight: "1.6"
                        }}
                        value={editingFile.content}
                        onChange={(e) => setEditingFile({ ...editingFile, content: e.target.value })}
                      />
                    </Column>
                  </Column>
                </Card>
              ) : (
                <>
                  <Flex justify="end" gap="12" width="100%">
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
            <Card width="100%" style={{ padding: "24px" }}>
              <Column gap="20">
                <Flex justify="space-between" align="center" width="100%">
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
                
                <Flex gap="12" align="center" padding="12" background="neutral-alpha-weak" radius="m" width="100%" style={{ display: isMobile ? "none" : "flex" }}>
                  <Text size="sm" weight="strong" width="100px">Image</Text>
                  <Text size="sm" weight="strong" width="30%">Alt Text</Text>
                  <Text size="sm" weight="strong" width="20%">Orientation</Text>
                  <Text size="sm" weight="strong" width="100px" textAlign="center">Action</Text>
                </Flex>

                <Column gap="12" width="100%">
                  {content.gallery?.images.map((img: any, index: number) => {
                    const isLandscape = img.orientation === "landscape" || img.orientation === "horizontal";
                    const toggleOrientation = () => {
                      const updatedImages = [...content.gallery.images];
                      updatedImages[index].orientation = isLandscape ? "portrait" : "landscape";
                      setContent({ ...content, gallery: { ...content.gallery, images: updatedImages } });
                    };

                    return (
                      <Flex 
                        key={index} 
                        gap="12" 
                        align="center" 
                        padding="12" 
                        background="neutral-alpha-weak" 
                        radius="m" 
                        width="100%"
                        style={{ flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center" }}
                      >
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
                          width={isMobile ? "100%" : "30%"}
                        />
                        <Button 
                          variant={isLandscape ? "secondary" : "ghost"} 
                          onClick={toggleOrientation}
                          width={isMobile ? "100%" : "20%"}
                          size="sm"
                        >
                          {isLandscape ? "Landscape" : "Portrait"}
                        </Button>
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
                    );
                  })}
                  {(!content.gallery?.images || content.gallery.images.length === 0) && (
                    <Flex padding="32" justify="center" width="100%">
                      <Text size="sm" onBackground="neutral-medium">No images in gallery.</Text>
                    </Flex>
                  )}
                </Column>
              </Column>
            </Card>
          )}
        </Column>
      </Column>
    </Flex>
  );
}
