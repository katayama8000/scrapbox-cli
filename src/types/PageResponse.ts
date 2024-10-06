export interface PageResponse {
    id: string; // ページのid
    title: string; // ページのタイトル
    image: string; // ページのサムネイル画像
    descriptions: string[]; // ページのサムネイル本文。おそらく最大5行
    pin: 0 | 1; // ピン留めされていたら1, されていなかったら0
    views: number; // ページの閲覧回数
    linked: number;  // おそらく被リンク数
    commitId?: string; // 最新の編集コミットid
    created: number; // ページの作成日時
    updated: number; // ページの最終更新日時
    accessed: number; // Date last visitedに使われる最終アクセス日時
    lastAccessed: number | null; // APIを叩いたuserの最終アクセス日時。おそらくこの値を元にテロメアの未読/既読の判別をしている
    snapshotCreated: number | null; // Page historyの最終生成日時
    snapshotCount: number; // 生成されたPage historyの数
    pageRank: number; // page rank
    persistent: boolean; // 不明。削除されたページだとfalse？
    lines: { // 本文。一行ずつ入っている
        id: string; // 行のid
        text: string; // 行のテキスト
        userId: string; // 一番最後に行を編集した人のid
        created: number; // 行の作成日時
        updated: number; // 行の最終更新日時
    }[];
    links: string[]; // ページ内のリンク
    icons: string[]; // ページアイコン
    files: string[]; // ページ内に含まれる、scrapbox.ioにアップロードしたファイルへのリンク
    relatedPages: {
        links1hop: {
            id: string; // ページのid
            title: string; // ページのタイトル
            titleLc: string;
            image: string; // ページのサムネイル画像
            descriptions: string[]; // ページのサムネイル本文。おそらく最大5行
            linksLc: string[];
            linked: number; // おそらく被リンク数
            updated: number; // ページの最終更新日時
            accessed: number; // おそらくページの閲覧日時
        }[];
        links2hop: {
            id: string; // ページのid
            title: string; // ページのタイトル
            titleLc: string;
            image: string; // ページのサムネイル画像
            descriptions: string[]; // ページのサムネイル本文。おそらく最大5行
            linksLc: string[]; // このページのリンク先のうち、links1hopにあるもの
            linked: number; // おそらく被リンク数
            updated: number; // ページの最終更新日時
            accessed: number; // おそらくページの閲覧日時
        }[];
        hasBackLinksOrIcons: boolean; // このページを参照しているページorアイコンがあればtrue
    };
    user: { // ページの編集者。最後に編集した人が入る？
        id: string;
        name: string;
        displayName: string;
        photo: string;
    };
    collaborators: { // このページの編集者から"user"を除いたもの
        id: string;
        name: string;
        displayName: string;
        photo: string;
    }[];
}