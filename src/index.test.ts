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
        expect(result.i18n.locales.eng.p["page.address.title"]).toBe("Address")
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
        expect(result.i18n.locales.eng.p["page.address.title"]).toBe("Address")
      })
    })
  })

  describe("Hidden fields", () => {
    const ocafile = async () => {
      const list3 = `ADD ATTRIBUTE street=Text zip=Text city=Text`
      let list3Resp = await axios.post(`${OCA_REPO}/api/oca-bundles`, list3)
      expect(list3Resp.data).toHaveProperty("said")

      const list2 = `ADD ATTRIBUTE address=Array[refs:${list3Resp.data.said}]`
      let list2Resp = await axios.post(`${OCA_REPO}/api/oca-bundles`, list2)
      expect(list2Resp.data).toHaveProperty("said")

      const list1 = `ADD ATTRIBUTE obj=refs:${list2Resp.data.said}`
      let list1Resp = await axios.post(`${OCA_REPO}/api/oca-bundles`, list1)
      expect(list1Resp.data).toHaveProperty("said")

      return `
ADD ATTRIBUTE list1=Array[refs:${list1Resp.data.said}]
ADD CARDINALITY ATTRS list1="1-"

ADD ATTRIBUTE list2=Array[Text]
ADD ENTRY_CODE ATTRS list2=["o1", "o2", "o3", "o4", "o5", "o6", "o7"]
ADD ENTRY en ATTRS list2={"o1": "One", "o2": "Two", "o3": "Three", "o4": "Four", "o5": "Five", "o6": "Six", "o7": "Seven"}

`
    }

    let bundleSAID = null
    beforeAll(async () => {
      let bundleResp = await axios.post(`${OCA_REPO}/api/oca-bundles`, await ocafile())
      expect(bundleResp.data).toHaveProperty("said")

      bundleSAID = bundleResp.data.said
    })

    test("creates lists with identifiers", async () => {
      const bundle = await axios.get(`${OCA_REPO}/api/oca-bundles/${bundleSAID}?w=true`)
      const pres = {
        v: "1.0.0",
        bd: bundleSAID,
        l: ["eng"],
        d: "EK0T5StXlcYwIhfp_wJxhIpYwYpEnMhHwnKbHnodhxFU",
        p: [
          {
            ns: "page 1",
            ao: [
              {
                nr: "list1",
                ao: [
                  {
                    nr: "obj",
                    ao: [{ nr: "address", ao: ["street", "zip", "city"] }],
                  },
                ],
              },
              "list2",
            ],
          },
        ],
        po: ["page 1"],
        pl: {
          eng: {
            "page 1": "First page",
          },
        },
        i: [
          {
            m: "web",
            c: "capture",
            a: {
              list1: { t: "list", id: true, idt: "uuid", on_item_remove: "inform" },
              "list1.obj.address": { t: "list", id: true, idt: "bigint", on_item_remove: "inform" },
            },
          },
        ],
      }

      const result = await from(bundle.data, pres, {})

      expect(result).toHaveNestedProperty("form.pages[0].fields[0].fields[0].type", "list")
      console.dir(result, { depth: null })
      const hf1 = result.form.pages[0].fields[0].fields[0].elementFields.find(
        (ef) => ef.name === "_id",
      )
      expect(hf1).toBeTruthy()
      expect(hf1.field.type).toBe("hidden")
      expect(hf1.field.format).toBe("uuid")

      expect(result).toHaveNestedProperty(
        "form.pages[0].fields[0].fields[0].elementFields[0].fields[0].fields[0].type",
        "list",
      )
      const hfList2 = result.form.pages[0].fields[0].fields[0].elementFields[0].fields[0].fields[0]
      expect(hfList2).toMatchObject({
        onItemRemove: "inform",
        type: "list",
      })
      const hf2 = hfList2.elementFields.find((ef) => ef.name === "_id")
      expect(hf2).toBeTruthy()
      expect(hf2.field.type).toBe("hidden")
      expect(hf2.field.format).toBe("bigint")

      expect(result.meta).toMatchObject({
        list1: {
          _id: { id: true, format: "uuid" },
          obj: {
            address: { _id: { id: true, format: "bigint" } },
          },
        },
      })
    })
  })

  describe("i a", () => {
    describe("select variants", () => {
      const ocafile = `ADD ATTRIBUTE multi=Array[Text]
ADD ENTRY_CODE ATTRS multi=["o1", "o2", "o3", "o4", "o5", "o6", "o7"]
ADD ENTRY en ATTRS multi={"o1": "One", "o2": "Two", "o3": "Three", "o4": "Four", "o5": "Five", "o6": "Six", "o7": "Seven"}
ADD LABEL en ATTRS multi="Multi"
`
      let bundleSAID = null
      beforeAll(async () => {
        let bundleResp = await axios.post(`${OCA_REPO}/api/oca-bundles`, ocafile)
        expect(bundleResp.data).toHaveProperty("said")
        bundleSAID = bundleResp.data.said
      })

      test("creates object graph", async () => {
        const bundle = await axios.get(`${OCA_REPO}/api/oca-bundles/${bundleSAID}?w=true`)
        const pres = {
          v: "1.0.0",
          bd: bundleSAID,
          l: ["eng"],
          d: "EK0T5StXlcYwIhfp_wJxhIpYwYpEnMhHwnKbHnodhxFU",
          p: [{ ns: "page 1", ao: ["multi"] }],
          po: ["page 1"],
          pl: {
            eng: {
              "page 1": "First page",
            },
          },
          i: [
            {
              m: "web", // interaction method
              c: "capture", // context
              a: {
                multi: { t: "select", va: "multiple" },
              },
            },
          ],
        }
        const result = await from(bundle.data, pres, {})
        expect(result.form.pages[0].fields[0].field.type).toBe("choice")
        expect(result.form.pages[0].fields[0].field.display.type).toBe("select-multiple")
      })
    })
  })
})

expect.extend({
  toHaveNestedProperty(received, path, expected) {
    const keys = path.replace(/\[(\d+)\]/g, ".$1").split(".") // Split on '.' and treat '[0]' as '.0'
    let current = received
    let traversedPath = ""

    for (const [index, key] of keys.entries()) {
      traversedPath += index > 0 ? `.${key}` : key

      if (Array.isArray(current)) {
        const arrayIndex = parseInt(key, 10)
        if (isNaN(arrayIndex) || arrayIndex >= current.length) {
          return {
            message: () =>
              `Failed at ${traversedPath}. Expected to find array index [${key}] but it was not found.\n` +
              `Traversed: ${traversedPath}\nRemaining: ${keys.slice(index + 1).join(".")}`,
            pass: false,
          }
        }
        current = current[arrayIndex]
      } else if (current && Object.prototype.hasOwnProperty.call(current, key)) {
        current = current[key]
      } else {
        return {
          message: () =>
            `Failed at ${traversedPath}. Expected to find property '${key}' but it was not found.\n` +
            `Traversed: ${traversedPath}\nRemaining: ${keys.slice(index + 1).join(".")}`,
          pass: false,
        }
      }
    }

    const pass = current === expected

    if (pass) {
      return {
        message: () => `Expected ${traversedPath} not to be ${expected}`,
        pass: true,
      }
    } else {
      return {
        message: () =>
          `Expected ${traversedPath} to be ${expected}, but received ${JSON.stringify(current)}`,
        pass: false,
      }
    }
  },
})
