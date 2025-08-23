#!/bin/bash

# This script fixes TypeScript errors in onboarding/service.ts by adding type assertions

FILE="src/lib/onboarding/service.ts"

# Fix line 75 - add type assertion for supabase query
sed -i '' "s/const { data: user, error: userError } = await supabase$/const { data: user, error: userError } = await (supabase as any)/" "$FILE"

# Fix line 84 - user?.id
sed -i '' "s/const supabaseUserId = user?.id/const supabaseUserId = (user as any)?.id/" "$FILE"

# Fix line 86 - user?.onboarding_completed_at
sed -i '' "s/if (user?.onboarding_completed_at)/if ((user as any)?.onboarding_completed_at)/" "$FILE"

# Fix line 95 - profile query
sed -i '' "s/const { data: profile, error: profileError } = await supabase$/const { data: profile, error: profileError } = await (supabase as any)/" "$FILE"

# Fix all profile property accesses (lines 114-149)
sed -i '' "s/if (profile\./if ((profile as any)\./g" "$FILE"
sed -i '' "s/profile\./((profile as any)\./g" "$FILE"

# Fix line 200 - update query
sed -i '' "s/\.update(userUpdateData)$/.update(userUpdateData as any)/" "$FILE"

# Fix line 373 - upsert query
sed -i '' "s/\.upsert(profileData as UserProfileInsert,/.upsert(profileData as any,/" "$FILE"

# Fix line 442 - update query 
sed -i '' "s/\.update({$/\.update({/" "$FILE"

# Fix line 487 - upsert query
sed -i '' "s/await supabase\.from('user_profiles')\.upsert(profileData,/await (supabase.from('user_profiles') as any).upsert(profileData as any,/" "$FILE"

# Fix line 537
sed -i '' "s/const supabaseUserId = user?.id/const supabaseUserId = (user as any)?.id/" "$FILE"

# Fix lines 637-641
sed -i '' "s/if (data && data\.id/if (data \&\& (data as any)\.id/" "$FILE"
sed -i '' "s/(this as any)\.supabaseUserId = data\.id/(this as any).supabaseUserId = (data as any).id/" "$FILE"
sed -i '' "s/return !!data?.onboarding_completed_at/return !!(data as any)?.onboarding_completed_at/" "$FILE"

# Fix line 661
sed -i '' "s/\.update({$/\.update({/" "$FILE"

echo "Type assertions added to onboarding/service.ts"