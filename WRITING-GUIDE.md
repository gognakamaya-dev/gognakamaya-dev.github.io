# How to use your site

Everything is plain text files. Edit them on github.com (press `.` in the repo to open the web editor) or on your laptop, commit, and GitHub rebuilds the site in about a minute.

## Write an essay

1. Make a new file in the `_essays/` folder named `YYYY-MM-DD-short-title.md`, for example `_essays/2026-11-02-why-i-build-hardware.md`. The part after the date becomes the URL: `/essays/why-i-build-hardware/`.
2. Start it with this header:

   ```
   ---
   title: Why I build hardware
   dek: An optional one-line subtitle.
   date: 2026-11-02
   ---
   ```

3. Write underneath in Markdown. `_essays/2026-10-29-example-essay.md` shows every trick: subheadings, quotes, footnotes, images, code.

**Margin notes.** Put a short aside inside a paragraph like this:

```
The board worked first time.<span class="margin-note">It did not.</span>
```

On a laptop it sits in the margin; on a phone it drops below the line.

**Drafts.** Add `published: false` to the header and the essay stays off the live site until you remove it.

**Images.** Put them in `assets/img/` and write `![description](/assets/img/name.jpg)`.

## Add a book

Open `_data/books.yml` and add an entry:

```
- title: The Design of Everyday Things
  author: Don Norman
  status: read          # reading, read or next
  year: 2026            # when you read it
  pages: 368            # makes the spine the right thickness
  color: "#5a1f1f"      # cloth colour of the spine (darker colours suit the gold lettering)
  note: One or two lines on why it stuck.
```

The order in the file is the order on the shelf. **The six books in there now are placeholders. Swap them for your own.**

## Update your work

Experience, projects, prizes, education and skills are all in `_data/work.yml`. Each entry becomes a "datasheet" on the Work page; photos go in `assets/img/`.

## The circuit board on the home page

The board is drawn by `_tools/board.py`. To add a chip or rename one, edit the lists in that file and run `python3 _tools/board.py`; it rewrites `_includes/board-wide.svg` (laptops) and `_includes/board-tall.svg` (phones). Each chip links to `/work/#slug`, so keep the slug matching the entry in `_data/work.yml`.

## Settings

`_config.yml` holds your name, description, and links. Add your email there to show it in the footer.

## Add travel photos

1. Upload your photos to `assets/img/travel/` (on GitHub: open the folder, then **Add file → Upload files**). Photos straight off a phone are huge, so shrink them to about 2000px wide first if you can.
2. Open `_data/travel.yml`, find the place, and add the photos under it:

   ```
   - name: Rome
     photos:
       - file: rome-colosseum.jpg
         caption: The Colosseum at sunset.   # optional
       - file: rome-trevi.jpg
   ```

New places go under their country (add `visits: 3` for repeat trips). A new country is a new block with `country:` and `places:`. Places with photos get a lit LED in the list and open into postcards; clicking a postcard shows it full size.

## The travel maps

Every place in `_data/travel.yml` with a `lat:` and `lon:` gets a pin on the maps automatically, and every country you list is plated in gold. To find a place's coordinates, right-click it on Google Maps; the first line of the menu is `lat, lon`. Places in Europe also appear on the zoomed-in Europe map.

The land shapes and the gold routes out of Dublin come from `_tools/map.js` (run it with Node after `npm i world-atlas@2 topojson-client@3` in `_tools/`). You only need it to add a new long-haul route or change the map area.
