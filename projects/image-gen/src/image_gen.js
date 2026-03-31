import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const API_KEY = process.env.DASHSCOPE_API_KEY;
const REPO_PATH = process.env.IMAGE_REPO_PATH || './output';

function ensureRepoDir() {
    if (!fs.existsSync(REPO_PATH)) {
        fs.mkdirSync(REPO_PATH, { recursive: true });
    }
}

function getNextFileName() {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, '').replace('T', '_').split('.')[0];
    const files = fs.readdirSync(REPO_PATH).filter(f => f.endsWith('.png'));
    let index = 1;
    for (const file of files) {
        const match = file.match(/^(\d{8}_\d{6})_(\d+)\.png$/);
        if (match) {
            const fileIndex = parseInt(match[2], 10);
            if (fileIndex >= index) index = fileIndex + 1;
        }
    }
    const indexStr = index.toString().padStart(3, '0');
    return `${timestamp}_${indexStr}.png`;
}

async function generateImage(prompt, options = {}) {
    if (!API_KEY) {
        throw new Error('请在.env文件中配置 DASHSCOPE_API_KEY');
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
                const imageResponse = await fetch(imageUrl);
                const imageBuffer = await imageResponse.arrayBuffer();
                
                const fileName = getNextFileName();
                const filePath = path.join(REPO_PATH, fileName);
                fs.writeFileSync(filePath, Buffer.from(imageBuffer));
                savedPaths.push(filePath);
            }
            
            return {
                success: true,
                images: savedPaths.map(p => ({
                    path: p,
                    name: path.basename(p)
                }))
            };
        } else if (data.output && data.output.task_status === 'FAILED') {
            throw new Error(`生图任务失败: ${data.output.message || '未知错误'}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('生图任务超时');
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args[0] === 'generate' || args[0] === 'gen') {
        const prompt = args.slice(1).join(' ');
        if (!prompt) {
            console.error('请输入生图提示词');
            console.log('用法: npm run generate -- "一只可爱的猫咪"');
            process.exit(1);
        }
        
        try {
            console.log('正在生成图片...');
            console.log(`提示词: ${prompt}`);
            const result = await generateImage(prompt);
            console.log('生成成功!');
            console.log('图片保存至:');
            result.images.forEach(img => console.log(`  - ${img.path}`));
        } catch (error) {
            console.error('生成失败:', error.message);
            process.exit(1);
        }
    } else {
        console.log('生图Agent - 通义万相API');
        console.log('');
        console.log('用法:');
        console.log('  npm run generate -- "提示词"    生成图片');
        console.log('');
        console.log('示例:');
        console.log('  npm run generate -- "一只可爱的猫咪"');
    }
}

export { generateImage, waitForTaskComplete };
