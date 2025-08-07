"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Database, Upload, Download, FileText, ImageIcon, Video, Music, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function ResourceLibrary() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">资源库系统</h2>
          <p className="text-gray-600">教学资源共享、学习资料下载和多媒体内容管理</p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          上传资源
        </Button>
      </div>

      <Tabs defaultValue="resources" className="space-y-6">
        <TabsList>
          <TabsTrigger value="resources">资源共享</TabsTrigger>
          <TabsTrigger value="materials">学习资料</TabsTrigger>
          <TabsTrigger value="media">多媒体</TabsTrigger>
          <TabsTrigger value="knowledge">知识点索引</TabsTrigger>
        </TabsList>

        <TabsContent value="resources" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  教学资源共享
                </CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input placeholder="搜索资源..." className="pl-10 w-64" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <CardTitle className="text-base">三年级数学教案</CardTitle>
                    </div>
                    <CardDescription>分数运算专题</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>文件大小</span>
                        <span>2.5MB</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>上传者</span>
                        <span>张老师</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>下载次数</span>
                        <Badge variant="outline">23次</Badge>
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-2 bg-transparent">
                        <Download className="h-4 w-4 mr-1" />
                        下载
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-green-500" />
                      <CardTitle className="text-base">语文课件PPT</CardTitle>
                    </div>
                    <CardDescription>古诗词赏析</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>文件大小</span>
                        <span>8.2MB</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>上传者</span>
                        <span>李老师</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>下载次数</span>
                        <Badge variant="outline">15次</Badge>
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-2 bg-transparent">
                        <Download className="h-4 w-4 mr-1" />
                        下载
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Video className="h-5 w-5 text-purple-500" />
                      <CardTitle className="text-base">英语教学视频</CardTitle>
                    </div>
                    <CardDescription>日常对话练习</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>文件大小</span>
                        <span>45.6MB</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>上传者</span>
                        <span>王老师</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>下载次数</span>
                        <Badge variant="outline">8次</Badge>
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-2 bg-transparent">
                        <Download className="h-4 w-4 mr-1" />
                        下载
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>按年级分类</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span>一年级资料</span>
                    <Badge variant="outline">12个文件</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span>二年级资料</span>
                    <Badge variant="outline">18个文件</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span>三年级资料</span>
                    <Badge variant="outline">25个文件</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span>四年级资料</span>
                    <Badge variant="outline">22个文件</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>按科目分类</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span>数学资料</span>
                    <Badge variant="outline">35个文件</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span>语文资料</span>
                    <Badge variant="outline">28个文件</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span>英语资料</span>
                    <Badge variant="outline">19个文件</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span>科学资料</span>
                    <Badge variant="outline">15个文件</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="media" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  教学视频
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">45</div>
                  <p className="text-sm text-gray-600">个视频文件</p>
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    查看全部
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  音频资料
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">23</div>
                  <p className="text-sm text-gray-600">个音频文件</p>
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    查看全部
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  图片素材
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">156</div>
                  <p className="text-sm text-gray-600">张图片</p>
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    查看全部
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>知识点索引</CardTitle>
              <CardDescription>按知识点快速查找相关资源</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3">数学知识点</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-sm">加减法运算</span>
                      <Badge variant="outline">8个资源</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-sm">分数运算</span>
                      <Badge variant="outline">12个资源</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-sm">几何图形</span>
                      <Badge variant="outline">6个资源</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">语文知识点</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-sm">拼音学习</span>
                      <Badge variant="outline">15个资源</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-sm">阅读理解</span>
                      <Badge variant="outline">10个资源</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-sm">作文写作</span>
                      <Badge variant="outline">7个资源</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
