/**
 * Image Generation Agent - Browser-compatible version
 * Uses native fetch API instead of node-fetch
 */

const API_KEY = import.meta.env.VITE_DASHSCOPE_API_KEY || '';
const REPO_PATH = './output';

function ensureRepoDir() {
  // In browser, we can't create directories, so we skip this
}

function getNextFileName() {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, '').replace('T', '_').split('.')[0];
    const indexStr = '001';
    return `${timestamp}_${indexStr}.png`;
}

async function generateImage(prompt, options = {}) {
    if (!API_KEY) {
        throw new Error('请在环境变量中配置 VITE_DASHSCOPE_API_KEY');
    }

    ensureRepoDir();

    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
            'X-DashScope-Async': 'enable'
        },
        body: JSON.stringify({
            model: 'wanx-v1',
            input: {
                prompt: prompt
            },
            parameters: {
                size: options.size || '1024*1024',
                n: options.n || 1,
                seed: options.seed || Math.floor(Math.random() * 1000000)
            }
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`API调用失败: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    if (data.output && data.output.task_id) {
        return await waitForTaskComplete(data.output.task_id);
    }
    
    throw new Error('API返回格式异常');
}

async function waitForTaskComplete(taskId, maxAttempts = 60) {
    const url = `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`;
    
    for (let i = 0; i < maxAttempts; i++) {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            }
        });
        
        const data = await response.json();
        
        if (data.output && data.output.task_status === 'SUCCEEDED') {
            const images = data.output.results;
            const savedPaths = [];
            
            for (const imgData of images) {
                const imageUrl = imgData.url;
                savedPaths.push({
                    url: imageUrl,
                    name: getNextFileName()
                });
            }
            
            return {
                success: true,
                images: savedPaths
            };
        } else if (data.output && data.output.task_status === 'FAILED') {
            throw new Error(`生图任务失败: ${data.output.message || '未知错误'}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('生图任务超时');
}

export { generateImage, waitForTaskComplete };
