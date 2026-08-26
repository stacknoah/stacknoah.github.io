import { statSync } from 'node:fs';
import { join } from 'node:path';

// 첨부는 public/files/ 에 두고 frontmatter 에서 파일명으로 가리킨다.
// 크기는 빌드할 때 실제 파일에서 읽는다. 손으로 적으면 반드시 어긋난다

export interface Attachment {
  /** public 아래 경로. files/report.pdf 처럼 적으면 됨 */
  file: string;
  /** 화면에 보일 이름. 없으면 파일명 */
  label?: string;
}

export interface ResolvedAttachment {
  href: string;
  name: string;
  ext: string;
  size: string | null;
  missing: boolean;
}

// 번들되면 import.meta.url 이 원본 위치를 안 가리킨다. 빌드 실행 위치를 기준으로
const PUBLIC = join(process.cwd(), 'public');

function human(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function resolveAttachments(list: Attachment[] = []): ResolvedAttachment[] {
  return list.map((a) => {
    const rel = a.file.replace(/^\/+/, '');
    const base = rel.split('/').pop() ?? rel;
    const dot = base.lastIndexOf('.');

    let size: string | null = null;
    let missing = false;
    try {
      size = human(statSync(join(PUBLIC, rel)).size);
    } catch {
      // 파일이 아직 없어도 빌드는 통과시키고 표시만 비운다
      missing = true;
    }

    return {
      href: `/${rel}`,
      name: a.label ?? base,
      ext: dot > 0 ? base.slice(dot + 1).toUpperCase() : '',
      size,
      missing,
    };
  });
}
