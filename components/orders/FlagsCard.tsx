import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export function FlagsCard({ flags, notes }: { flags: string[]; notes: string | null }) {
  if (flags.length === 0 && !notes) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Flags &amp; Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {flags.length > 0 && (
          <ul className="space-y-1.5">
            {flags.map((flag, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2"
              >
                <span className="mt-0.5 text-amber-500 shrink-0">⚠</span>
                {flag}
              </li>
            ))}
          </ul>
        )}
        {notes && (
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">{notes}</p>
        )}
      </CardContent>
    </Card>
  );
}
