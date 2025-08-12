* I checked our network requests logs and saw that there is a ETH TOKEN in popular cached runes which makes no sense??? use supabase to see this entry and remove it please. Also it seems like there is something wrong with the cached-popular-runes because on the "runes info" tab i get these:

{
    "success": true,
    "data": [
        {
            "token_id": "840000:3",
            "token": "DOG•GO•TO•THE•MOON",
            "symbol": "🐕",
            "icon": "https://icon.unisat.io/icon/runes/DOG•GO•TO•THE•MOON",
            "is_verified": true
        },
        {
            "token_id": "845764:84",
            "token": "BILLION•DOLLAR•CAT",
            "symbol": "🐱",
            "icon": "https://icon.unisat.io/icon/runes/BILLION•DOLLAR•CAT",
            "is_verified": true
        },
        {
            "token_id": "840000:28",
            "token": "RSIC•GENESIS•RUNE",
            "symbol": "⧈",
            "icon": "https://icon.unisat.io/icon/runes/RSIC•GENESIS•RUNE",
            "is_verified": true
        },
        {
            "token_id": "840000:41",
            "token": "PUPS•WORLD•PEACE",
            "symbol": "☮",
            "icon": "https://icon.unisat.io/icon/runes/PUPS•WORLD•PEACE",
            "is_verified": true
        },
        {
            "token_id": "865193:4006",
            "token": "GIZMO•IMAGINARY•KITTEN",
            "symbol": "😺",
            "icon": "https://icon.unisat.io/icon/runes/GIZMO•IMAGINARY•KITTEN",
            "is_verified": true
        },
        {
            "token_id": "867138:1861",
            "token": "CYPHER•GENESIS",
            "symbol": "🤖",
            "icon": "https://icon.unisat.io/icon/runes/CYPHER•GENESIS",
            "is_verified": true
        },
        {
            "token_id": "840000:2",
            "token": "DECENTRALIZED",
            "symbol": "⚡",
            "icon": "https://icon.unisat.io/icon/runes/DECENTRALIZED",
            "is_verified": true
        },
        {
            "token_id": "866595:325",
            "token": "OOZY•GOOZEMO",
            "symbol": "🐌",
            "icon": "https://icon.unisat.io/icon/runes/OOZY•GOOZEMO",
            "is_verified": true
        },
        {
            "token_id": "840010:907",
            "token": "LIQUIDIUM•TOKEN",
            "symbol": "🫠",
            "icon": "https://icon.unisat.io/icon/runes/LIQUIDIUM•TOKEN",
            "is_verified": true
        },
        {
            "token_id": "866807:12",
            "token": "MEMENTO•MORI",
            "symbol": "💀",
            "icon": "https://icon.unisat.io/icon/runes/MEMENTO•MORI",
            "is_verified": true
        },
        {
            "token_id": "840000:407",
            "token": "THE•DONALD•TRUMP",
            "symbol": "🔳",
            "icon": "https://icon.unisat.io/icon/runes/THE•DONALD•TRUMP",
            "is_verified": false
        },
        {
            "token_id": "840000:45",
            "token": "MAGIC•INTERNET•MONEY",
            "symbol": "🧙",
            "icon": "https://icon.unisat.io/icon/runes/MAGIC•INTERNET•MONEY",
            "is_verified": true
        },
        {
            "token_id": "840000:45",
            "token": "MAGIC•INTERNET•MONEY",
            "symbol": "🧙",
            "icon": "https://icon.unisat.io/icon/runes/MAGIC•INTERNET•MONEY",
            "is_verified": true
        },
        {
            "token_id": "840000:22",
            "token": "SATOSHI•NAKAMOTO",
            "symbol": "丰",
            "icon": "https://icon.unisat.io/icon/runes/SATOSHI•NAKAMOTO",
            "is_verified": true
        },
        {
            "token_id": "867080:468",
            "token": "BITCOIN•BRO•BEAR",
            "symbol": "🐻",
            "icon": "https://icon.unisat.io/icon/runes/BITCOIN•BRO•BEAR",
            "is_verified": true
        },
        {
            "token_id": "840127:179",
            "token": "WADDLE•WADDLE•PENGU",
            "symbol": "🐧",
            "icon": "https://icon.unisat.io/icon/runes/WADDLE•WADDLE•PENGU",
            "is_verified": true
        },
        {
            "token_id": "840010:907",
            "token": "LIQUIDIUM•TOKEN",
            "symbol": "🫠",
            "icon": "https://icon.unisat.io/icon/runes/LIQUIDIUM•TOKEN",
            "is_verified": true
        },
        {
            "token_id": "844462:155",
            "token": "NIKOLA•TESLA•GOD",
            "symbol": "🌏",
            "icon": "https://icon.unisat.io/icon/runes/NIKOLA•TESLA•GOD",
            "is_verified": false
        },
        {
            "token_id": "840010:4",
            "token": "WANKO•MANKO•RUNES",
            "symbol": "🐶",
            "icon": "https://icon.unisat.io/icon/runes/WANKO•MANKO•RUNES",
            "is_verified": true
        },
        {
            "token_id": "850440:2163",
            "token": "NOOT•NOOT•MFERS",
            "symbol": "🐧",
            "icon": "https://icon.unisat.io/icon/runes/NOOT•NOOT•MFERS",
            "is_verified": true
        },
        {
            "token_id": "847192:2336",
            "token": "PIGGED•BY•PIGGY",
            "symbol": "🐽",
            "icon": "https://icon.unisat.io/icon/runes/PIGGED•BY•PIGGY",
            "is_verified": true
        },
        {
            "token_id": "840000:158",
            "token": "THE•OFFICIAL•BOZO",
            "symbol": "$",
            "icon": "https://icon.unisat.io/icon/runes/THE•OFFICIAL•BOZO",
            "is_verified": true
        }
    ]
}

while on the swap tab i get these:

{
    "success": true,
    "data": {
        "data": [
            {
                "id": "liquidiumtoken",
                "rune": "LIQUIDIUM•TOKEN",
                "name": "LIQUIDIUM•TOKEN",
                "imageURI": "https://icon.unisat.io/icon/runes/LIQUIDIUM%E2%80%A2TOKEN",
                "etching": {
                    "runeName": "LIQUIDIUM•TOKEN"
                }
            },
            {
                "id": "ordinals_ethtoken",
                "rune": "ETH•TOKEN",
                "name": "ETH•TOKEN",
                "imageURI": "https://icon.unisat.io/icon/runes/ETH%E2%80%A2TOKEN",
                "etching": {
                    "runeName": "ETH•TOKEN"
                }
            },
            {
                "id": "ordinals_dogtoken",
                "rune": "DOG•TOKEN",
                "name": "DOG•TOKEN",
                "imageURI": "https://icon.unisat.io/icon/runes/DOG%E2%80%A2TOKEN",
                "etching": {
                    "runeName": "DOG•TOKEN"
                }
            }
        ],
        "isStale": true,
        "cacheAge": null,
        "skippedRefresh": true
    }
}

the response from the runes info tab is actually correct but i think it might come directly from satsterminal sdk/api so that is also confusing because we should always get the data from supabase in order to not spam the sats terminal api... please investigate this, i think the problem might be that we are not correctly upserting the data from satsterminal's api to our supabase db for the cached popular runes or something and there seems to be an inconsistency how we are doing it on swap tab versus the runes info tab (maybe it's also different from the borrow tab, not sure) - please investigate this and propose a plan how we can fix this so we have super clean and working code following KISS and DRY principals.

* check network tab to see what calls we are making and its responses. - check if it all aligns with our local code or if there is room for optimization or if we are spamming any API or query or something unnecessarily. Include sample API responses for everything relevant in our CLAUDE.md file. If you can't access the network requests, ask me, so I can give them to you. If you do so, give me clear instructions how I should give them to you.
* are there any similar or duplicate logic snippets in the codebase that we can extract into shared components to follow KISS and DRY principals? if so, please find them and create a plan for implementation.