/**
 * Curated word banks for the naming engine.
 *
 * Each bank is a whitespace-separated list so it is easy to scan, review and
 * extend. Every entry must be a single word (no spaces or hyphens): double-
 * barrelled surnames are assembled from the barrel banks at runtime.
 *
 * Rules for contributors:
 * - No names of characters from Toast of London / Toast of Tinseltown.
 * - No slurs, nothing cruel, nothing that is only funny because it is crude.
 * - Prefer words that could plausibly sit on a theatre programme or a
 *   solicitor's letterhead. Absurdity should come from the pairing.
 * - Keep entries unique within a kind (given names vs surname banks); the
 *   corpus tests enforce this.
 */

export const GIVEN_DATA = {
  /** Plausible modern British given names, mostly 1960s–1990s births. */
  ordinary: `
    Gary Kevin Neil Barry Clive Trevor Darren Wayne Dean Craig Lee Paul Mark Ian
    Gavin Keith Derek Graham Colin Nigel Martin Simon Stuart Alan Brian Dave
    Terry Tony Malcolm Roger Geoff Phil Rob Andy Pete Mick Kenny Jason Carl
    Shane Lloyd Glen Russell Duncan Gareth Rhys Owen Euan Ross Jamie Scott
    Kieran Ryan Liam Callum Jordan Ashley Warren Vince Les Ken Damian Adrian
    Sharon Tracey Karen Julie Debbie Mandy Lorraine Denise Jackie Gail Wendy
    Janet Linda Carol Gillian Alison Joanne Kerry Nicola Michelle Donna Angela
    Paula Tina Lisa Claire Sarah Emma Gemma Leanne Kelly Stacey Jodie Hayley
    Natalie Rachel Helen Fiona Jill Sue Pam Lynn Bev Trish Elaine Maxine Dawn
    Kim Toni Sally Becky Kirsty Lindsey Tanya Sonia Andrea Deborah Yvonne
  `,
  /** Names that peaked before decimalisation. */
  oldFashioned: `
    Cyril Reginald Mervyn Bernard Ronald Stanley Wilfred Horace Clifford Leonard
    Norman Gordon Harold Herbert Albert Walter Sidney Cecil Maurice Douglas
    Kenneth Dennis Roland Eric Ernest Frank Gerald Howard Lionel Neville Percy
    Ralph Royston Victor Bertram Archibald Desmond Edna Mabel Ethel Dorothy
    Muriel Gladys Hilda Vera Agnes Winifred Beryl Doreen Phyllis Marjorie Ivy
    Elsie Enid Ida Maud Nora Olive Peggy Rita Sybil Thelma Violet Brenda Hazel
    Joyce Mavis Pauline Shirley Sheila Valerie Audrey Constance Dulcie Freda
    Lilian Nancy Irene Iris Myrtle Prudence Arnold Cuthbert Wallace Edwin
  `,
  /** Grand, stagey or public-school names. */
  theatrical: `
    Peregrine Crispin Rupert Jolyon Tarquin Hugo Sebastian Ptolemy Lysander
    Ambrose Cosmo Fenella Araminta Clementine Octavia Imogen Cressida
    Persephone Benedict Barnaby Montgomery Aurelius Cassius Leander Orlando
    Valentine Florian Lucian Evander Caspian Horatio Ignatius Lancelot
    Tristram Gideon Inigo Jago Quentin Rollo Piers Giles Hector Atticus
    Augustus Cornelius Algernon Bartholomew Ottoline Allegra Arabella
    Celestine Delphine Esmeralda Georgiana Isadora Lavinia Leonora Marguerite
    Ophelia Philippa Rosalind Seraphina Theodora Venetia Wilhelmina Saffron
    Tallulah Cordelia Portia Calliope Hermia Lucasta Jocasta Felicity
    Rosamund Clarissa Florentyna Hyperion
  `,
  /** Rare, rustic or faintly improbable names that are funny in context. */
  eccentric: `
    Basil Bevis Hedley Lyndon Elton Dabney Thaddeus Ebenezer Fitzroy Hamish
    Ludo Boz Gus Monty Rex Jem Dougal Murdo Torquil Kenelm Sholto Bram Pim
    Ned Rab Zeb Wes Cy Merlin Lemuel Obadiah Ezekiel Jethro Enoch Amos Silas
    Rufus Magnus Oswald Osbert Egbert Godfrey Humphrey Wendell Clarence Digby
    Dudley Dorian Ferdinand Gilbert Ivor Kit Mungo Quincy Roderick Septimus
    Tobias Ulric Vernon Yorick Zachariah Petula Dymphna Griselda Hepzibah
    Kezia Loveday Morwenna Perpetua Philomena Ottilie Tabitha Temperance
    Thomasina Zillah Bathsheba Clemency Euphemia Lettice Marigold Fidelma
    Honoria Gwendolyn Fen Abel Lazarus Leopold
  `,
} as const;

export const SURNAME_DATA = {
  /** Household objects, tools, fittings and clothing: the "ordinary noun" surname. */
  household: `
    Kettle Ladle Trowel Gravel Pewter Hassock Bollard Gasket Sprocket Grommet
    Spigot Rivet Tarmac Gusset Cardigan Flannel Bracket Plinth Gazebo Pergola
    Hosepipe Dustpan Mangle Colander Spatula Thimble Bobbin Mortar Pestle
    Wicket Chalice Satchel Duvet Bolster Tinsel Doily Tureen Lozenge Hamper
    Saucer Trellis Hinge Latch Doorstop Lintel Gutter Flagon Tankard Goblet
    Ewer Pitcher Trivet Fender Poker Bellows Candlewick Wainscot Banister
    Casement Mullion Pantile Grout Putty Washer Flange Ratchet Dowel Chisel
    Gimlet Bradawl Plunger Sponge Loofah Cistern Lampshade Ottoman Divan
    Footstool Hatstand Brolly Galosh Mitten Anorak Cagoule Blazer Waistcoat
    Cravat Brogue Plimsoll Slipper Bunting Rosette Trophy Pennant Gramophone
    Wireless Kiosk Turnstile Lectern Hymnal Easel Blotter Inkwell Quill
    Envelope Postcard Parcel Leaflet Brochure Almanac Gazette Dossier Binder
    Clipboard Abacus Sextant Barometer Radiator Boiler Sundial Weathervane
    Trough Churn Pail Scythe Sickle Mattock Shovel Cloche Pallet Crate
    Tarpaulin Sandbag Pipette Beaker Funnel Siphon Piston Tappet Hubcap
    Carburettor Dimmer Socket Thermos Cufflink Tiepin Eiderdown Valance
  `,
  /** Food and drink, leaning towards the tea room and the school canteen. */
  food: `
    Biscuit Crumpet Muffin Gammon Brisket Lettuce Turnip Parsnip Marrow Custard
    Trifle Crouton Chutney Pickle Gherkin Sherbet Toffee Fudge Nougat Marzipan
    Stilton Cheddar Saveloy Rissole Dumpling Pudding Scone Barm Teacake
    Flapjack Shortbread Garibaldi Macaroon Meringue Eclair Pavlova Strudel
    Crumble Cobbler Junket Blancmange Jelly Radish Celery Shallot Swede
    Mangetout Sprout Cabbage Kale Spinach Rhubarb Gooseberry Damson Quince
    Medlar Greengage Sultana Currant Raisin Pretzel Waffle Pancake Fritter
    Pasty Gravy Dripping Suet Tripe Haggis Oatcake Porridge Muesli Mustard
    Pepper Nutmeg Clove Ginger Cinnamon Paprika Cumin Treacle Syrup Honeycomb
    Humbug Gobstopper Liquorice Bonbon Pastille Truffle Praline Brioche Bagel
    Gateau Battenberg Kedgeree Goulash Lasagne Ravioli Gnocchi Polenta Fondue
    Quiche Souffle Terrine Brawn Biscotti Cracknel Parkin Bramley Pippin
  `,
  /** Commerce, law and abstract nouns: the dry, bureaucratic surname. */
  commerce: `
    Refund Invoice Receipt Deposit Mortgage Pension Surplus Ledger Tariff
    Dividend Rebate Discount Overdraft Merger Quota Tender Bargain Margin
    Venture Premium Bonus Voucher Coupon Bulletin Memo Agenda Clause Tribunal
    Verdict Statute Caveat Codicil Affidavit Proviso Motion Notion Promise
    Pardon Lament Remorse Gesture Prospect Outlook Forecast Profit Revenue
    Arrears Levy Deficit Audit Appraisal Subsidy Annuity Equity Bursary
    Stipend Royalty Retainer Expense Allowance Gratuity Surcharge Ransom
    Warrant Mandate Charter Covenant Treaty Accord Summons Subpoena Probate
    Tenure Freehold Leasehold Easement Lien Petition Referendum Ballot Census
    Quorum Consensus Pretext Premise Inkling Hunch Whim Caprice Rumour
    Hearsay Innuendo Pretence Bravado Gumption Pittance Windfall Jackpot
    Wager Gamble Raffle Lottery Sweepstake Rebuttal Mileage Overtime Payroll
  `,
  /** Verbs of movement, fuss and fluster used as surnames. */
  motion: `
    Pounce Trundle Wobble Dawdle Fumble Rummage Muster Plunder Grapple Lurch
    Fluster Bluster Swagger Dither Ponder Saunter Flounce Hustle Scuttle
    Shuffle Stumble Tumble Fidget Flutter Waddle Swivel Topple Wallop Clatter
    Rattle Jostle Huddle Muddle Grumble Mumble Ramble Rumble Scramble Scrabble
    Shamble Sidle Slouch Stride Strut Swoon Totter Trudge Wander Wangle
    Whittle Wrangle Yodel Gallop Canter Amble Bustle Chortle Guffaw Titter
    Smirk Simper Gawp Loiter Linger Meander Mooch Bodge Botch Bungle
    Skedaddle Dally Hobble Fettle Tinker Rumple
  `,
  /** British flora, fauna, fish and weather. */
  nature: `
    Moss Bracken Thistle Gorse Nettle Sorrel Fennel Pebble Shingle Stoat
    Weasel Ferret Badger Heron Plover Curlew Puffin Gannet Pheasant Grouse
    Haddock Halibut Turbot Pike Perch Mullet Bream Kipper Pilchard Mackerel
    Sprat Whelk Cockle Winkle Limpet Barnacle Oyster Prawn Shrimp Lobster
    Gull Rook Jackdaw Magpie Starling Thrush Wren Linnet Lapwing Bittern
    Dunnock Nuthatch Wagtail Kestrel Buzzard Osprey Vole Shrew Otter Marten
    Polecat Hare Toad Newt Snail Beetle Earwig Moth Gnat Midge Hornet Lichen
    Fern Bramble Hawthorn Blackthorn Alder Willow Aspen Larch Spruce Juniper
    Cowslip Primrose Foxglove Hogweed Dandelion Teasel Burdock Clover Yarrow
    Tansy Mallow Campion Bindweed Groundsel Ragwort Puddle Drizzle Sleet
    Hailstone Mizzle Squall Tadpole Minnow Gudgeon Roach Chub Dace Tench
    Barbel Loach Gurnard Pollock Hake Plaice Brill Skate Samphire Dogrose
  `,
  /** Grand, aristocratic or stately-home surnames. */
  grand: `
    Pemberton Fotheringham Ashcombe Montague Beauchamp Delacourt Harcourt
    Wolverton Rathbone Ravenscroft Blenkinsop Cholmondeley Featherstonehaugh
    Courtenay Fairfax Grosvenor Haverstock Lambourne Mortimer Northcote Ormsby
    Pelham Quarrington Rutherford Stanhope Tremayne Vandervelde Warburton
    Wetherby Wyndham Aldridge Ainsley Balfour Belvedere Bramwell Carrington
    Chadwick Chatsworth Cuthbertson Dalrymple Danvers Devereux Dunsford
    Egerton Ellingham Everard Fanshawe Fitzwilliam Galbraith Gresham
    Hartington Hathersage Heathcote Ingleby Kingsmill Kirkpatrick Langley
    Lavington Lockhart Lovelace Maitland Mandeville Merriweather Molesworth
    Musgrave Nightingale Ogilvy Pakenham Pennington Ponsonby Popplewell
    Prendergast Rawlinson Rockingham Rothwell Sackville Saltonstall Sedgwick
    Sinclair Spottiswoode Strickland Swinburne Templeton Thistlethwaite
    Thornbury Treadwell Trelawney Venables Wainwright Waverley Westmacott
    Whitmore Willoughby Winterbottom Worthington Wraxall Yarborough
  `,
  /** Down-to-earth regional English surnames, the "grounded" partner for an eccentric given name. */
  grounded: `
    Perkins Hobbs Dobson Platt Pickering Higgins Crabtree Sutcliffe Pollard
    Ackroyd Hebblethwaite Arkwright Bagshaw Bamford Barraclough Bickerstaff
    Boothroyd Braithwaite Brindle Bunce Butterworth Clegg Cragg Crossley Dawber
    Dinsdale Duckworth Entwistle Fairclough Fazackerley Gledhill Greenhalgh
    Grimshaw Haworth Hepworth Higginbottom Hinchcliffe Hirst Holroyd Horrocks
    Illingworth Jowett Kershaw Lumb Marsden Midgley Mottram Nuttall Ormerod
    Pickles Postlethwaite Pratt Ramsbottom Rigby Rushworth Shufflebottom
    Sidebottom Slack Smethurst Sowerby Stubbs Tattersall Thewlis Tomlinson
    Townend Uttley Walmsley Whiteley Wolstenholme Womersley Yeadon Bottomley
    Dodds Gubbins Huxtable Judd Lipscombe Maggs Muncaster Nobbs Oddy Prout
    Quigley Rudd Scattergood Tuffin Twigg Veasey Whitworth Wragg Haigh
    Ibbotson Learoyd Mellor Ogden Sugden Tetley Unsworth Hargreaves
  `,
  /** Flamboyant loanwords, dances, fabrics and commotions. */
  flamboyant: `
    Flamenco Tarantella Bolero Calypso Mambo Fiesta Gazpacho Cantata Fresco
    Piccolo Vibrato Tremolo Crescendo Stucco Mosaic Marmalade Cavalier
    Brouhaha Hullabaloo Kerfuffle Rigmarole Palaver Shindig Hoopla Ballyhoo
    Gallimaufry Malarkey Hokum Bunkum Twaddle Folderol Rumba Samba Tango
    Polka Mazurka Quadrille Gavotte Minuet Sarabande Rondo Scherzo Allegro
    Adagio Arpeggio Staccato Pizzicato Libretto Falsetto Soprano Contralto
    Baritone Concerto Sonata Toccata Bravura Cadenza Encore Fanfare Flourish
    Jamboree Carnival Regatta Gala Soiree Cabaret Burlesque Vaudeville
    Charade Tableau Masquerade Escapade Serenade Cascade Promenade Esplanade
    Colonnade Rotunda Veranda Portico Gondola Flotilla Armada Avalanche
    Sirocco Mistral Zephyr Paradox Velvet Taffeta Chiffon Brocade Organza
    Damask Paisley Gingham Chenille Mohair Angora Cashmere Fandangle
  `,
} as const;

/** Left half of a double-barrelled surname: weighty, mostly two or three syllables. */
export const BARREL_LEFT_DATA = `
  Ashworth Bellamy Carstairs Ellerby Featherby Gosling Hartigan Kettering
  Lambert Mallory Nettleship Ollerton Pargeter Quilliam Radley Sefton Tatham
  Upcott Wexley Yardley Allardyce Bagnall Beresford Birtwhistle Blundell
  Bracewell Brockway Calloway Cartwright Chetwynd Clutterbuck Coggeshall
  Crowhurst Dimmock Dorrington Drinkwater Eastwood Fairweather Farquhar
  Fenwick Gilchrist Goodbody Gorringe Hallett Harbottle Hartnell Hazeldine
  Hollingsworth Inchbald Jessop Kimber Kingdom Lavender Leatherbarrow
  Lightfoot Lomax Mabbott Merriman Middlemiss Moberly Nethercott Openshaw
  Plumley Proudfoot Rattigan Rendell Ripley Rowbotham Satterthwaite
  Shillingford Silverwood Smallbone Sparrowhawk Starkey Stillwell Sweetapple
  Thackeray Thorogood Tidmarsh Trotman Truscott Tunnicliffe Turnbull Vosper
  Wadsworth Walsingham Warrender Wigglesworth Winstanley Witherspoon
  Woodhouse Wrigley Custard Gravel Pewter Tinsel Biscuit Thistle Kettle
  Crumpet Bracken Trellis Gusset Mortimer Pemberton Ravenscroft Fanshawe
`;

/** Right half of a double-barrelled surname: short and blunt, one or two syllables. */
export const BARREL_RIGHT_DATA = `
  Smythe Pugh Price Hughes Fitch Platt Webb Crisp Hatch Bold Wise Stout Pike
  Thorne Ware Lamb Fox Gull Ling Dodd Budd Tate Bligh Croft Gage Hogg Judd
  Kemp Lacey Mudd Nye Onslow Penn Quill Rook Sharp Shaw Snell Spratt Stark
  Trigg Tuck Vane Venn Voss Wild Wren Yapp Bunn Clay Cobb Crane Dove Drake
  Flint Frost Gale Grigg Hale Holt Hurst Inch Jolly Kidd Knott Marsh Nash
  Oakes Pyle Shanks Slade Stiles Swann Tapp Thrupp Tibbs Trapp Truss Vowles
  Wagg Ward Wigg Grey Moss Lusk Peck Bloom
`;
