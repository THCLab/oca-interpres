import axios from "axios"
import { beforeAll, describe, expect, test } from "vitest"
import { from } from "./index.js"

const OCA_REPO: string | undefined = process.env.OCA_REPO

if (!OCA_REPO) {
  throw new Error("OCA_REPO env variable is not set")
}

describe("#from", () => {
  describe("when 'ns' is used", () => {
    let bundleResp = null
    const ocafile = `ADD ATTRIBUTE d=Text i=Text passed=Boolean nice_attr=Text
ADD META en PROPS name="Entrance credential" description="Entrance credential"
ADD META pl PROPS name="Kredenszjal wejściowy" description="Kredenszjal wejściowy"
ADD INFORMATION en ATTRS \
	d="Schema digest" \
	i="Credential Issuee" \
	passed="Enables or disables passing"\
	nice_attr="nice placeholder"
ADD LABEL en ATTRS\
	d="Schema digest"\
	i="Credential Issuee"\
	passed="Passed"\
	nice_attr="Nice attribute"
ADD LABEL pl ATTRS\
	d="trawić schemat"\
	i="Kredenszjal wystawiacz"\
	passed="Zaliczony"\
	nice_attr="Ładny atrybut"
`
    beforeAll(async () => {
      bundleResp = await axios.post(`${OCA_REPO}/api/oca-bundles`, ocafile)
      expect(bundleResp.data).toHaveProperty("said")
    })

    test("creates object graph", async () => {
      const bundle = await axios.get(`${OCA_REPO}/api/oca-bundles/${bundleResp.data.said}?w=true`)
      const pres = {
        v: "1.0.0",
        bd: bundleResp.data.said,
        l: ["eng", "ita"],
        d: "EK0T5StXlcYwIhfp_wJxhIpYwYpEnMhHwnKbHnodhxFU",
        p: [
          {
            ns: "page 2",
            ao: ["i"],
          },
          {
            ns: "page 1",
            ao: ["d"],
          },
        ],
        po: ["page 1", "page 2"],
        pl: {
          eng: {
            "page 1": "First page",
            "page 2": "Second page",
          },
          ita: {
            "page 1": "Prima pagina",
            "page 2": "Seconda pagina",
          },
        },
        i: [],
      }
      const result = await from(bundle.data, pres, {})
      console.dir(result, { depth: null })
    })
  })

  describe("with references", () => {
    const ocafile2 = `ADD ATTRIBUTE street=Text zip=Text city=Text
ADD META en PROPS name="Address" description="Address schema"
ADD META pl PROPS name="Adres" description="Schema adresu"
ADD CONFORMANCE ATTRS city=M street=M
ADD LABEL en ATTRS\
	street="Street"\
	zip="Zip code"\
	city="City"
ADD LABEL pl ATTRS\
	street="Ulica"\
	zip="Kod pocztowy"\
	city="Miasto"
ADD ATTRIBUTE is_nice=Boolean
ADD LABEL en ATTRS is_nice="Is nice"
ADD LABEL pl ATTRS is_nice="Czy ładny"
ADD CONFORMANCE ATTRS is_nice=M
`

    const ocafile1 = (
      addrSAID: string,
    ) => `ADD ATTRIBUTE d=Text i=Text passed=Boolean nice_attr=Text
ADD META en PROPS name="Entrance credential" description="Entrance credential"
ADD META pl PROPS name="Kredenszjal wejściowy" description="Kredenszjal wejściowy"
ADD INFORMATION en ATTRS \
	d="Schema digest" \
	i="Credential Issuee" \
	passed="Enables or disables passing"\
	nice_attr="nice placeholder"
ADD LABEL en ATTRS\
	d="Schema digest"\
	i="Credential Issuee"\
	passed="Passed"\
	nice_attr="Nice attribute"
ADD LABEL pl ATTRS\
	d="trawić schemat"\
	i="Kredenszjal wystawiacz"\
	passed="Zaliczony"\
	nice_attr="Ładny atrybut"
ADD ATTRIBUTE address=refs:${addrSAID}
ADD LABEL en ATTRS address="Address"
ADD LABEL pl ATTRS address="Adres"
`

    let bundleSAID = null
    beforeAll(async () => {
      let addrResp = await axios.post(`${OCA_REPO}/api/oca-bundles`, ocafile2)
      expect(addrResp.data).toHaveProperty("said")

      let bundleResp = await axios.post(`${OCA_REPO}/api/oca-bundles`, ocafile1(addrResp.data.said))
      expect(bundleResp.data).toHaveProperty("said")
      bundleSAID = bundleResp.data.said
    })

    describe("when deprecated 'n' is used", () => {
      test("creates object graph", async () => {
        const pres = {
          v: "1.0.0",
          bd: bundleSAID,
          l: ["eng", "ita"],
          d: "EK0T5StXlcYwIhfp_wJxhIpYwYpEnMhHwnKbHnodhxFU",
          p: [
            {
              n: "page 2",
              ao: ["i", { n: "address", ao: ["city", "street"] }],
            },
            {
              n: "page 1",
              ao: ["d"],
            },
          ],
          po: ["page 1", "page 2"],
          pl: {
            eng: {
              "page 1": "First page",
              "page 2": "Second page",
            },
            ita: {
              "page 1": "Prima pagina",
              "page 2": "Seconda pagina",
            },
          },
          i: [],
        }
        const bundle = await axios.get(`${OCA_REPO}/api/oca-bundles/${bundleSAID}?w=true`)
        const result = await from(bundle.data, pres, {})
        expect(result.form.pages).toHaveLength(2)
        expect(result.form.pages[0].title).toBe("page 1")
        expect(result.form.pages[1].title).toBe("page 2")
        expect(result.form.pages[1].fields.map((el) => el.name)).toEqual(["i", "address"])
        expect(result.form.pages[1].fields[1].fields).toBeInstanceOf(Array)
        console.dir(result, { depth: null })
      })
    })

    describe("when 'nr' and 'ns' are used", () => {
      test("creates object graph", async () => {
        const pres = {
          v: "1.0.0",
          bd: bundleSAID,
          l: ["eng", "ita"],
          d: "EK0T5StXlcYwIhfp_wJxhIpYwYpEnMhHwnKbHnodhxFU",
          p: [
            {
              ns: "page 2",
              ao: [
                "i",
                { nr: "address", ao: ["city", "street"] },
                { ns: "nice embedding section", ao: ["nice_attr"] },
              ],
            },
            {
              n: "page 1",
              ao: ["d"],
            },
          ],
          po: ["page 1", "page 2"],
          pl: {
            eng: {
              "page 1": "First page",
              "page 2": "Second page",
              "nice embedding section": "Nice embedding section",
            },
            ita: {
              "page 1": "Prima pagina",
              "page 2": "Seconda pagina",
              "nice embedding section": "Sezione di incorporamento piacevole",
            },
          },
          i: [],
        }
        const bundle = await axios.get(`${OCA_REPO}/api/oca-bundles/${bundleSAID}?w=true`)
        const result = await from(bundle.data, pres, {})
        expect(result.form.pages[1].title).toBe("page 2")
        expect(result.form.pages[1].fields.map((el) => el.name)).toEqual([
          "i",
          "address",
          "nice embedding section",
        ])
        expect(result.form.pages[1].fields[1].fields).toBeInstanceOf(Array)
        console.dir(result, { depth: null })
      })
    })
  })
})
