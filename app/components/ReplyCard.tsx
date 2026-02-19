import { Post } from '@/types/post'

interface ReplyCardProps {
    reply: Post
}

export default function ReplyCard({ reply }: ReplyCardProps) {
    const displayName = reply.author.split('@')[0]
    const handle = `@${reply.author}`

    
    const date = new Date(reply.created_at)
    const timeAgo = date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
    })

    return (
        <article className="flex gap-3 px-4 py-3 hover:bg-bat-dark/10 transition-colors cursor-default relative">
            {}
            <div className="absolute top-0 left-[2.3rem] bottom-0 w-0.5 bg-bat-dark/50 -z-10" />

            {}
            <div className="flex-shrink-0 relative z-10">
                <div className="h-8 w-8 rounded-full bg-bat-dark border border-bat-dark flex items-center justify-center text-bat-gray font-bold text-sm select-none">
                    {displayName[0].toUpperCase()}
                </div>
            </div>

            {}
            <div className="flex-1 min-w-0 pt-0.5">
                {}
                <div className="flex items-baseline gap-1.5 text-sm leading-4">
                    <span className="font-bold text-bat-gray/90 truncate">
                        {displayName}
                    </span>
                    <span className="text-bat-gray/50 truncate text-xs">
                        {handle}
                    </span>
                    <span className="text-bat-gray/40 text-xs">
                        · {timeAgo}
                    </span>
                </div>

                {}
                <div className="mt-0.5 text-[14px] text-bat-gray/80 whitespace-pre-wrap leading-normal">
                    {reply.content}
                </div>

                {}
                <div className="flex gap-12 mt-2 text-bat-gray/40">
                    {}
                </div>
            </div>
        </article>
    )
}
