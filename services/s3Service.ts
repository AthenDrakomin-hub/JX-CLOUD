
import { supabase } from "./supabaseClient";

/**
 * 针对生产环境 Web 端优化的存储服务
 * 使用 Supabase 原生 Storage API 代替 AWS S3 SDK
 * 彻底解决 Edge 运行时下 fs.readFile 的环境冲突错误
 */

const BUCKET_NAME = "jiangxiyunchu";

export interface S3File {
  key: string;
  url: string;
  size: number;
  lastModified: Date;
}

export const s3Service = {
  /**
   * 拉取云端文件列表
   */
  async listFiles(): Promise<S3File[]> {
    try {
      if (!supabase) return [];
      
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list('', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        key: item.name,
        // 获取公共 URL - 确保实时更新
        url: supabase.storage.from(BUCKET_NAME).getPublicUrl(item.name).data.publicUrl,
        size: item.metadata?.size || 0,
        lastModified: new Date(item.updated_at || item.created_at),
      }));
    } catch (error) {
      console.error("Storage List Error:", error);
      return [];
    }
  },

  /**
   * 上传文件至云端
   */
  async uploadFile(file: File): Promise<string> {
    if (!supabase) throw new Error("Supabase client not initialized");
    
    // 生成干净的 Key，移除中文字符和空格以防止 URL 编码问题
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^\x00-\x7F]/g, "").replace(/\s+/g, "_");
    const key = `${timestamp}-${safeName}`;

    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(key, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;
      return data.path;
    } catch (error) {
      console.error("Storage Upload Error:", error);
      throw error;
    }
  },

  /**
   * 从云端彻底移除资产
   */
  async deleteFile(key: string): Promise<void> {
    if (!supabase) throw new Error("Supabase client not initialized");

    try {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([key]);

      if (error) throw error;
    } catch (error) {
      console.error("Storage Delete Error:", error);
      throw error;
    }
  }
};