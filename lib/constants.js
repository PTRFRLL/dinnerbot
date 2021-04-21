/**
 * Responses used by bot
 * [USER] is replaced by user(s) mention e.g. @PTRFRLL
 */
const RESPONSES = {
    UNAUTHED: [
        ':middle_finger:', 
        'Who are you again?', 
        ':poop:', 
        'How bout you drink a nice glass of shut the hell up :coffee:', 
        'Could you fucking not?', 
        `You're stupid and I hate you`
    ],
    WINNER: [
        'Do I smell chicken :chicken:, [USER]?', 
        'What\'s that smell, [USER]?', 
        'Mmm, something smells good [USER]', 
        '[USER], did you order Popeyes :chicken:?', 
        '[USER] Looks like we got some winners over here :fork_knife_plate:',
        '[USER] Look at these fucking guys :eyes:'
    ],
    SPECTATOR: [
        'Couldn\'t make it to the end, [USER]? :skull_crossbones:', 
        'At least you\'re light, [USER] :stuck_out_tongue_winking_eye:', 
        '[USER] gettin carried per usual...', 
        '[USER] for MVP :smiling_imp:', 
        '[USER], there for moral support... :angel:'
    ]
}

/**
 * Maps which qualify for presence detection
 */
const VALID_MAPS = [
    'Sanhok', 
    'Vikendi', 
    'Erangel', 
    'Miramar', 
    'Karakin', 
    'Erangel (Remastered)', 
    'Paramo'
];

/**
 * Discord's PUBG Application ID
 */
const PUBG_APP_ID = "530196305138417685";

/**
 * Whitelist of image extensions bot can download from Discord API
 */
const ALLOWED_EXT = ['png', 'jpeg', 'jpg'];

/**
 * Timeouts used when querying PUBG API for stats
 */
const STATS = {
    WAIT_TIME_IN_SECONDS: 100,
    RETRY_TIME_IN_SECONDS: 30,
    ABANDON_AFTER_IN_SECONDS: 300
}

/**
 * Image comparison score must be under this value to be considered a win (default: 20000)
 */
const IMG_SCORE_THRESHOLD = 20000;

/**
 * Example: Mar 26 10:56AM
 */
const SIMPLE_DATE_FORMAT = 'MMM d h:mma';


module.exports = {
    RESPONSES,
    VALID_MAPS,
    PUBG_APP_ID,
    ALLOWED_EXT,
    STATS,
    IMG_SCORE_THRESHOLD,
    SIMPLE_DATE_FORMAT
}