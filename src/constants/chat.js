export const LLM_OPTIONS = [
  {
    id: 'qwen3-max',
    name: 'Qwen3 Max',
    description: '千问系列最强大模型，适合复杂任务'
  },
  {
    id: 'glm-4.7',
    name: 'GLM-4.7',
    description: '智谱 AI 专为智能体设计的混合推理模型'
  },
  {
    id: 'kimi-k2.5',
    name: 'Kimi-K2.5',
    description: 'Kimi 系列迄今最全能的模型，在通用智能任务上取得开源 SOTA 表现'
  }
]

export const MCP_TOOL_OPTIONS = [
  {
    label: '糖尿病知识图谱',
    value: 'search_diabetes_knowledge_graph',
    description: '查询基于 DiaKG 构建的知识图谱，包括临床研究、药物使用、临床病例、诊断和治疗方法等'
  },
  {
    label: "健康数据查询",
    value: 'fetch_health_data',
    description: '查询用户健康档案、血糖记录、运动记录'
  }
]