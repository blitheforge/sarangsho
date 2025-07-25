"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Save, Eye, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/rich-text-editor";
import { createSlug, validateSlug } from "@/lib/utils/slug";
import { useToast } from "@/hooks/use-toast";

export default function NewBlogPost() {
  const router = useRouter();
  const { toast } = useToast();
  const [post, setPost] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    status: "draft",
    thumbnail: "",
    seoTitle: "",
    seoDescription: "",
    tags: "",
  });
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [slugError, setSlugError] = useState("");
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(true);

  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "uploaded" | "error"
  >("idle");

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/admin");
    }
  }, [router]);

  // Auto-generate slug from title
  useEffect(() => {
    if (post.title && isGeneratingSlug) {
      const newSlug = createSlug(post.title);
      setPost((prev) => ({ ...prev, slug: newSlug }));
      setSlugError("");
    }
  }, [post.title, isGeneratingSlug]);

  const handleSlugChange = (value: string) => {
    setIsGeneratingSlug(false);
    setPost((prev) => ({ ...prev, slug: value }));

    if (value && !validateSlug(value)) {
      setSlugError(
        "Slug can only contain lowercase letters, numbers, and hyphens"
      );
    } else {
      setSlugError("");
    }
  };

  const handleThumbnailUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1. Show local preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setThumbnailPreview(result);
      };
      reader.readAsDataURL(file);

      setUploadStatus("uploading");

      // 2. Upload to server
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setUploadStatus("uploaded");

          setPost((prev) => ({ ...prev, thumbnail: data.url }));

          toast({
            variant: "success",
            title: "Upload Successful",
            description: "Thumbnail uploaded successfully!",
          });
        } else {
          setUploadStatus("error");
          toast({
            variant: "destructive",
            title: "Upload Failed",
            description:
              data.error || "Server did not return a valid response.",
          });
          setThumbnailPreview(""); // Optional: remove preview on failure
          setPost((prev) => ({ ...prev, thumbnail: "" })); // Reset thumbnail
        }
      } catch (error) {
        setUploadStatus("error");
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: "An error occurred while uploading the image.",
        });
        setThumbnailPreview("");
        setPost((prev) => ({ ...prev, thumbnail: "" }));
      }
    }
  };

  const handleSave = async (status: "draft" | "published") => {
    if (uploadStatus === "uploading") {
      toast({
        variant: "destructive",
        title: "Upload in Progress",
        description: "Please wait for the thumbnail to finish uploading.",
      });
      return;
    }
    if (slugError) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fix the slug error before saving",
      });
      return;
    }

    const postData = { ...post, status };

    try {
      const response = await fetch("/api/blog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        toast({
          variant: "success",
          title: "Success!",
          description: `Post ${
            status === "published" ? "published" : "saved as draft"
          } successfully!`,
        });
        router.push("/admin/blog");
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to save post",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save post. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin/blog">
                <Button variant="ghost" size="sm">
                  ← Back to Blog
                </Button>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                New Blog Post
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={() => handleSave("draft")}>
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button onClick={() => handleSave("published")}>
                <Eye className="w-4 h-4 mr-2" />
                Publish
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Post Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <Input
                    placeholder="Enter post title..."
                    value={post.title}
                    onChange={(e) =>
                      setPost((prev) => ({ ...prev, title: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug
                  </label>
                  <Input
                    placeholder="post-url-slug"
                    value={post.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className={slugError ? "border-red-500" : ""}
                  />
                  {slugError && (
                    <p className="text-sm text-red-600 mt-1">{slugError}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    URL: /blog/{post.slug || "post-slug"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Excerpt
                  </label>
                  <Textarea
                    placeholder="Brief description of the post..."
                    rows={3}
                    value={post.excerpt}
                    onChange={(e) =>
                      setPost((prev) => ({ ...prev, excerpt: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <RichTextEditor
                    value={post.content}
                    onChange={(content) =>
                      setPost((prev) => ({ ...prev, content }))
                    }
                    placeholder="Write your blog post content here..."
                    height={500}
                  />
                </div>
              </CardContent>
            </Card>

            {/* SEO Settings */}
            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Title
                  </label>
                  <Input
                    placeholder="SEO optimized title..."
                    value={post.seoTitle}
                    onChange={(e) =>
                      setPost((prev) => ({ ...prev, seoTitle: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SEO Description
                  </label>
                  <Textarea
                    placeholder="Meta description for search engines..."
                    rows={3}
                    value={post.seoDescription}
                    onChange={(e) =>
                      setPost((prev) => ({
                        ...prev,
                        seoDescription: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <Input
                    placeholder="news, technology, journalism (comma separated)"
                    value={post.tags}
                    onChange={(e) =>
                      setPost((prev) => ({ ...prev, tags: e.target.value }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Publish Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <Select
                    value={post.status}
                    onValueChange={(value) =>
                      setPost((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Featured Image */}
            <Card>
              <CardHeader>
                <CardTitle>Featured Image</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {thumbnailPreview ? (
                    <div className="relative">
                      <img
                        src={thumbnailPreview || "/placeholder.svg"}
                        alt="Thumbnail preview"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                        onClick={() => {
                          setThumbnailPreview("");
                          setPost((prev) => ({ ...prev, thumbnail: "" }));
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Upload featured image
                      </p>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    className="hidden"
                    id="thumbnail-upload"
                  />
                  <label htmlFor="thumbnail-upload">
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      asChild
                    >
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadStatus === "uploading" ? (
                          <>
                            Uploading<span className="dot-animation">.</span>
                          </>
                        ) : (
                          "Choose Image"
                        )}
                      </span>
                    </Button>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
