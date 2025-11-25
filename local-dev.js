// local-dev.js
// When running on localhost, install a lightweight mock of the Supabase client
// so the app can be tested without real keys or network.

(function () {
  try {
    const host = location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") return;

    console.info("Luah: running in local mock mode (localhost)");

    const mockVents = [];
    const mockComments = [];
    let ventId = 1;
    let commentId = 1;

    function nowISO() {
      return new Date().toISOString();
    }

    class MockQuery {
      constructor(table) {
        this.table = table;
        this._filters = [];
        this._order = null;
        this._insertPayload = null;
      }

      select() {
        let data = [];
        if (this.table === "vents") {
          data = mockVents.slice();
        } else if (this.table === "vent_comments") {
          data = mockComments.slice();
        }

        // filters: only eq supported
        for (const f of this._filters) {
          if (f.type === "eq") {
            data = data.filter((row) => String(row[f.col]) === String(f.val));
          }
        }

        // order: created_at
        if (this._order && this._order.col && this._order.col === "created_at") {
          data.sort((a, b) => {
            if (this._order.ascending) {
              return a.created_at > b.created_at ? 1 : -1;
            }
            return a.created_at < b.created_at ? 1 : -1;
          });
        }

        return Promise.resolve({ data, error: null });
      }

      order(col, opts) {
        this._order = { col, ascending: !!(opts && opts.ascending) };
        return this;
      }

      eq(col, val) {
        this._filters.push({ type: "eq", col, val });
        return this;
      }

      insert(payload) {
        this._insertPayload = payload;
        return this;
      }

      async single() {
        if (this.table === "vents" && this._insertPayload) {
          const payload = this._insertPayload;
          const record = {
            id: ventId++,
            text: payload.text || "",
            mood: payload.mood || "Uncategorized",
            created_at: nowISO()
          };
          mockVents.unshift(record);
          return { data: record, error: null };
        }
        return { data: null, error: null };
      }

      then(resolve) {
        // For insert on vent_comments where app doesn't call .select() or .single()
        if (this.table === "vent_comments" && this._insertPayload) {
          const payload = this._insertPayload;
          const rec = {
            id: commentId++,
            vent_id: payload.vent_id,
            text: payload.text,
            created_at: nowISO()
          };
          mockComments.push(rec);
          return Promise.resolve({ data: rec, error: null }).then(resolve);
        }
        return Promise.resolve({ data: null, error: null }).then(resolve);
      }
    }

    function createMockClient() {
      return {
        from(table) {
          return new MockQuery(table);
        }
      };
    }

    window.supabase = window.supabase || {};
    window.supabase.createClient = function () {
      return createMockClient();
    };
  } catch (e) {
    console.error("local-dev mock init failed", e);
  }
})();
