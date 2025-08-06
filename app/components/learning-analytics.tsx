"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { BarChart3, TrendingUp, Target, AlertTriangle, Users, BookOpen } from "lucide-react"

export default function LearningAnalytics() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">学习分析系统</h2>
          <p className="text-gray-600">学习数据统计、进步趋势分析和个性化学习建议</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">数据概览</TabsTrigger>
          <TabsTrigger value="trends">趋势分析</TabsTrigger>
          <TabsTrigger value="weaknesses">薄弱环节</TabsTrigger>
          <TabsTrigger value="suggestions">学习建议</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总学生数</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">89</div>
                <p className="text-xs text-muted-foreground">活跃学生</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">平均成绩</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">84.2</div>
                <p className="text-xs text-muted-foreground">+2.1 较上月</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">学习时长</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">156</div>
                <p className="text-xs text-muted-foreground">小时/月</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">进步学生</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">67</div>
                <p className="text-xs text-muted-foreground">75% 学生进步</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>科目成绩分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>数学</span>
                      <span>86.5分</span>
                    </div>
                    <Progress value={86.5} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>语文</span>
                      <span>82.1分</span>
                    </div>
                    <Progress value={82.1} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>英语</span>
                      <span>78.9分</span>
                    </div>
                    <Progress value={78.9} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>科学</span>
                      <span>84.3分</span>
                    </div>
                    <Progress value={84.3} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>班级排名</CardTitle>
                <CardDescription>按平均成绩排序</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>四年级B班</span>
                    <Badge variant="default">88.5分</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>三年级A班</span>
                    <Badge variant="secondary">85.2分</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>五年级C班</span>
                    <Badge variant="outline">79.8分</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>六年级D班</span>
                    <Badge variant="outline">77.3分</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  成绩趋势分析
                </CardTitle>
                <CardDescription>最近6个月的成绩变化</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>2023年8月</span>
                    <Badge variant="outline">78.2分</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>2023年9月</span>
                    <Badge variant="outline">79.8分</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>2023年10月</span>
                    <Badge variant="outline">81.5分</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>2023年11月</span>
                    <Badge variant="secondary">82.1分</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>2023年12月</span>
                    <Badge variant="secondary">83.7分</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>2024年1月</span>
                    <Badge variant="default">84.2分</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>学习活跃度</CardTitle>
                <CardDescription>学生参与度统计</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>作业提交率</span>
                      <span>94.2%</span>
                    </div>
                    <Progress value={94.2} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>课堂参与度</span>
                      <span>87.5%</span>
                    </div>
                    <Progress value={87.5} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>在线学习时长</span>
                      <span>92.1%</span>
                    </div>
                    <Progress value={92.1} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>考试参与率</span>
                      <span>98.9%</span>
                    </div>
                    <Progress value={98.9} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="weaknesses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                薄弱环节识别
              </CardTitle>
              <CardDescription>需要重点关注的学习领域</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">数学薄弱点</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-sm">分数运算</span>
                      <Badge variant="destructive">需加强</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-sm">几何图形</span>
                      <Badge variant="secondary">一般</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-sm">应用题</span>
                      <Badge variant="destructive">需加强</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">语文薄弱点</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-sm">阅读理解</span>
                      <Badge variant="secondary">一般</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-sm">作文写作</span>
                      <Badge variant="destructive">需加强</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-sm">古诗词</span>
                      <Badge variant="default">良好</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  个性化学习建议
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">王小明</h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• 数学基础扎实，建议挑战更难的题目</li>
                      <li>• 语文作文需要多练习，增加词汇量</li>
                      <li>• 英语口语表达能力有待提高</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">李小红</h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• 学习态度认真，需要提高学习效率</li>
                      <li>• 数学计算准确性需要加强</li>
                      <li>• 建议增加课外阅读量</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>学习资源推荐</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="border rounded-lg p-3">
                    <div className="font-medium mb-1">数学强化练习</div>
                    <p className="text-sm text-gray-600">针对分数运算的专项练习题集</p>
                    <Badge variant="outline" className="mt-1">
                      推荐
                    </Badge>
                  </div>

                  <div className="border rounded-lg p-3">
                    <div className="font-medium mb-1">语文阅读理解</div>
                    <p className="text-sm text-gray-600">提高阅读理解能力的训练材料</p>
                    <Badge variant="outline" className="mt-1">
                      推荐
                    </Badge>
                  </div>

                  <div className="border rounded-lg p-3">
                    <div className="font-medium mb-1">英语口语练习</div>
                    <p className="text-sm text-gray-600">日常对话和发音练习资源</p>
                    <Badge variant="outline" className="mt-1">
                      推荐
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
