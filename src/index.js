// eslint-disable-next-line @typescript-eslint/ban-ts-comment
const { OCABox } = require("oca.js")
const Sugar = require("sugar-date")

const DEFAULT_LANG = "eng"

/** @typedef {string} SAID */

let isOptional = (/** @type {string | undefined} */ conformance) => {
  return !(conformance === "M" || conformance === "m")
}

/**
 * @param { Record<string, string> } attrPresProperties
 */
let chooseDisplayType = (attrPresProperties) => {
  if (attrPresProperties?.type === "radio") {
    switch (attrPresProperties.orientation) {
      case "horizontal":
        return "radio-horizontal"
      case "vertical":
        return "radio-vertical"
      default:
        return null
    }
  } else if (attrPresProperties?.type === "select") {
    switch (attrPresProperties.variant) {
      case "multiple":
        return "select-multiple"
      default:
        return null
    }
  }
}

let detectCardinality = (/** @type {string | undefined} */ cardinality) => {
  if (!cardinality) return [null, null]
  if (!cardinality.includes("-")) {
    return [cardinality, cardinality]
  }
  const [min, max] = cardinality.split("-")
  return [min, max]
}

/**
 * @param { import("oca.js").IAttribute } attr
 * @param { Record<string, string> } attrPresProperties
 * @returns { import("@frontend/common/OcaForm.js").OcaField }
 */
let buildField = (attr, attrPresProperties) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  let attrType = attr.type

  // Attribute can consist of entries no matter of the attribute type
  if (attr.entries) {
    let variants = []
    // Take first language as default and rest would be provided via i18n
    let firstKey = Object.keys(attr.entries)[0]
    if (typeof attr.entry_codes === "object") {
      if (Array.isArray(attr.entry_codes)) {
        for (const entry of attr.entry_codes || []) {
          variants.push({
            name: entry,
            label: /** @type {string} */ (attr.entries[firstKey][entry]),
          })
        }
      } else {
        for (const [group_key, entry_codes] of Object.entries(attr.entry_codes)) {
          const options = []
          for (const entry of entry_codes || []) {
            options.push({
              name: entry,
              label: /** @type {string} */ (attr.entries[firstKey][entry]),
            })
          }
          variants.push({
            name: group_key,
            label: /** @type {string} */ (attr.entries[firstKey][group_key]),
            options,
          })
        }
      }
    }
    let displayType = "select"
    const rdt = chooseDisplayType(attrPresProperties)
    if (rdt) displayType = rdt

    /** @type { import("@frontend/common/OcaForm.js").OcaChoiceField} */
    let f = {
      type: "choice",
      display: { type: displayType },
      variants: variants,
    }
    return f
  }

  if (Array.isArray(attrType)) {
    const [min, max] = detectCardinality(attr.cardinality)
    const minLength = min && min.trim().length > 0 ? parseInt(min) : null
    const maxLength = max && max.trim().length > 0 ? parseInt(max) : null

    if (attrType[0] === "Binary" && attrPresProperties?.type === "file") {
      /** @type { import("@frontend/common/OcaForm.js").OcaMultiFileField } */
      let f = {
        type: "multifile",
        accept: null,
        maxSize: null,
        minFiles: minLength,
        maxFiles: maxLength,
      }
      return f
    }

    if (attrPresProperties?.type === "question") {
      /** @type { import("@frontend/common/OcaForm.js").OcaArrayField } */
      let f = {
        type: "array",
        minLength,
        maxLength,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        elementField: buildField({ ...attr, type: attrType[0] }, attrPresProperties),
      }
      return f
    }

    /** @type { import("@frontend/common/OcaForm.js").OcaArrayField } */
    let f = {
      type: "array",
      minLength,
      maxLength,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      elementField: buildField({ ...attr, type: attrType[0] }, attrPresProperties),
    }
    return f
  }

  if (attrPresProperties?.type) {
    if (attrPresProperties.type === "textarea" && attrType === "Text") {
      /** @type { import("@frontend/common/OcaForm.js").OcaTextField } */
      let f = {
        type: "text",
        multiline: true,
        pattern: attr.format || null,
      }
      return f
    } else if (attrPresProperties.type === "code_scanner" && attrType === "Text") {
      /** @type { import("@frontend/common/OcaForm.js").OcaCodeScannerField} */
      let f = {
        type: "code_scanner",
        pattern: attr.format || null,
      }
      return f
    } else if (attrPresProperties.type === "file" && attrType === "Binary") {
      /** @type { import("@frontend/common/OcaForm.js").OcaFileField} */
      let f = {
        type: "file",
        accept: null,
        maxSize: null,
      }
      return f
    } else if (attrPresProperties.type === "signature" && attrType === "Binary") {
      /** @type { import("@frontend/common/OcaForm.js").OcaSignatureField} */
      let f = {
        type: "signature",
      }
      return f
    } else if (attrPresProperties.type === "list") {
      console.log("list")
      return f
    }
  }
  if (attrType === "Text") {
    if (!attr.entries) {
      /** @type { import("@frontend/common/OcaForm.js").OcaTextField } */
      let f = {
        type: "text",
        multiline: false,
        /* minLength: 0,
        maxLength: 0, */
        pattern: attr.format || null,
      }
      return f
    }
    // eslint-disable-next-line no-empty
  } else if (attrType === "Numeric") {
    /** @type { import("@frontend/common/OcaForm.js").OcaNumberField } */
    let f = {
      type: "number",
    }
    if (attr.units) {
      const [system, unit] = Object.entries(attr.units)[0]
      f.unitSystem = system
      f.unit = unit
    }
    if (attrPresProperties?.type === "number") {
      f.range = attrPresProperties.range
      f.step = attrPresProperties.step
    }
    return f
  } else if (attrType === "Boolean") {
    /** @type { import("@frontend/common/OcaForm.js").OcaCheckboxField } */
    let f = {
      type: "checkbox",
    }
    return f
  } else if (attrType === "DateTime") {
    let range
    if (attrPresProperties?.range) {
      const start = Sugar.Date.create(attrPresProperties.range[0])
      const end = Sugar.Date.create(attrPresProperties.range[1])
      range = [start, end]
    }

    if (attrPresProperties?.type === "date") {
      /** @type { import("@frontend/common/OcaForm.js").OcaDateField } */
      let f = {
        type: "date",
        format: attr.format || null,
      }
      if (range) f.range = range
      return f
    } else if (attrPresProperties?.type === "time") {
      /** @type { import("@frontend/common/OcaForm.js").OcaTimeField } */
      let f = {
        type: "time",
        format: attr.format || null,
      }
      if (range) f.range = range
      return f
    } else if (attrPresProperties?.type === "datetime") {
      /** @type { import("@frontend/common/OcaForm.js").OcaDateTimeField } */
      let f = {
        type: "datetime",
        format: attr.format || null,
      }
      if (range) f.range = range
      return f
    }
  } else if (attrType.match(/^refs:/) && attrPresProperties?.type === "signature") {
    /** @type { import("@frontend/common/OcaForm.js").OcaSignatureField} */
    let f = {
      type: "signature",
      canvasFieldName: attrPresProperties.canvas,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      timestampFieldName: attrPresProperties.geolocation?.timestamp,
      geolocationFieldsName: {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        latitudeFieldName: attrPresProperties.geolocation?.latitude,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        longitudeFieldName: attrPresProperties.geolocation?.longitude,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        accuracyFieldName: attrPresProperties.geolocation?.accuracy,
      },
    }
    return f
  } else if (attrPresProperties.type === "question" && attrType.match(/^refs:/)) {
    /** @type { import("@frontend/common/OcaForm.js").OcaQuestionField} */
    let f = {
      type: "question",
    }
    return f
  }

  throw new Error(`Unsupported attribute type: ${attrType} for attribute ${attr.name}`)
}

const meta = {}

/**
 * @param {import("../db/schemas.js").BundleWithDeps} bundleWithDeps
 * @param {string} id
 * @param {import("../schemas/conditionals.js").ConditionalsType} conditionals
 * @param {string[]} readonlies
 * */
module.exports.from = async (bundleWithDeps, presentation, conditionals = {}, readonlies = []) => {
  /** @type { import("../schemas/i18n.js").FormI18nType }*/
  let i18n = { locales: {} }
  if (presentation.bd !== bundleWithDeps.bundle.d) {
    throw new Error(
      `Presentation ${presentation.bd} is not compatible with the bundle ${bundleWithDeps.bundle.d}.`,
    )
  }
  const presLangs = presentation.l
  for (const lang of presLangs) {
    i18n.locales[lang] = {
      a: {},
      p: {},
      m: {},
    }
  }
  const oca_box = new OCABox().load(bundleWithDeps.bundle)
  /** @type { Record<SAID, OCABox> } */
  let OCABoxDeps = {}
  bundleWithDeps.dependencies.forEach((dep) => {
    OCABoxDeps[dep.d] = new OCABox().load(dep)
  })
  /** @type { Record<string, SAID> } */
  let referencedAttrs = {}

  const isRefAttr = (/** @type {string} */ attrType) => {
    if (Array.isArray(attrType)) {
      return isRefAttr(attrType[0])
    }
    if (attrType.match(/^refs:/)) {
      return true
    }
    return false
  }
  const extractRef = (/** @type {string} */ attrType) => {
    if (Array.isArray(attrType)) {
      return extractRef(attrType[0])
    }
    return attrType.replace(/^refs:/, "")
  }
  // Check if all the top level OCA Bundle attributes being references
  // are having resolved depenedencies
  const attrRefCheck = (
    /** @type {string} */ attrOCASaid,
    /** @type {string} */ attrType,
    /** @type {string} */ attrName,
  ) => {
    if (isRefAttr(attrType)) {
      if (OCABoxDeps[extractRef(attrType)]) {
        referencedAttrs[attrOCASaid + "." + attrName] = extractRef(attrType)
        return
      }
      throw new Error(
        `Attribute ${attrName} is a referencing attribute, but the referenced bundle cannot be found. The attribute type was ${attrType}`,
      )
    }
  }
  const loadAndCheckDeps = (/** @type {OCABox} */ ocaBox) => {
    const attrOCASaid = ocaBox.generateBundle().d
    for (let attr of ocaBox.attributes()) {
      let attrType = null
      if (typeof attr.type === "string") {
        attrRefCheck(attrOCASaid, attr.type, attr.name)
        attrType = attr.type
      } else if (Array.isArray(attr.type)) {
        attrRefCheck(attrOCASaid, attr.type[0], attr.name)
        attrType = attr.type[0]
      } else {
        throw new Error(`Attribute ${attr.name} has an unsupported type`)
      }
      if (isRefAttr(attrType)) {
        loadAndCheckDeps(OCABoxDeps[extractRef(attrType)])
      }
    }
  }
  loadAndCheckDeps(oca_box)

  /** @type { import("@frontend/common/OcaForm.js").OcaFormPage[] } */
  let pages = []

  const findAttr = (/** @type {string} */ attrName, /** @type {OCABox} */ ocaBox) => {
    let foundAttr = ocaBox.attributes().find((attr) => attr.name === attrName)
    if (!foundAttr) {
      throw new Error(
        `Attribute "${attrName}" not found in OCA bundle ${JSON.stringify(ocaBox.meta())}.`,
      )
    }
    return foundAttr
  }

  let interaction = presentation.i?.find((inter) => inter.m === "web" && inter.c === "capture")

  const prefill = (
    /** @type {import("oca.js").IAttribute} */ attr,
    /** @type Record<string, string> */ attrPresProperties,
  ) => {
    if (attr.type === "Boolean" && attrPresProperties?.type === "radio") {
      attr.entries = {
        [DEFAULT_LANG]: { true: "prefill.yes", false: "prefill.no" },
      }
      attr.entry_codes = ["true", "false"]
    }
    return attr
  }

  const prepField = (
    /** @type {import("oca.js").IAttribute} */ attr,
    /** @type {undefined | string} */ namespace,
  ) => {
    let attrNameWithNs = attr.name
    if (namespace) {
      attrNameWithNs = `${namespace}.${attr.name}`
    }
    /** @type { Record<string, string> } */
    let attrPresentationProp = {}
    let attrMeta = interaction?.a?.[attrNameWithNs]
    if (attrMeta) {
      attrPresentationProp.type = attrMeta.t
      switch (attrMeta.t) {
        default:
          attrPresentationProp = {
            ...attrPresentationProp,
            orientation: attrMeta.o,
            variant: attrMeta.va,
          }
          break
        case "number":
          attrPresentationProp = { ...attrPresentationProp, range: attrMeta.r, step: attrMeta.s }
          break
        case "date":
        case "time":
        case "datetime":
          attrPresentationProp = { ...attrPresentationProp, range: attrMeta.r }
          break
      }
      if (attrMeta.t === "signature" && attrMeta.m) {
        attrPresentationProp.canvas = attrMeta.m.canvas
        attrPresentationProp.geolocation = {
          latitude: attrMeta.m.geolocation?.latitude,
          longitude: attrMeta.m.geolocation?.longitude,
          accuracy: attrMeta.m.geolocation?.accuracy,
          timestamp: attrMeta.m.geolocation?.timestamp,
        }
      }
    }
    attr = prefill(attr, attrPresentationProp)
    /** @type { import("@frontend/common/OcaForm.js").OcaFieldEntry } */
    let field = {
      name: attr.name,
      label: attr.labels?.eng || "",
      optional: isOptional(attr.conformance),
      readonly:
        readonlies.includes(attrNameWithNs) ||
        readonlies.some((r) => attrNameWithNs.startsWith(r + ".")),
      condition: conditionals[attrNameWithNs],
      field: buildField(attr, attrPresentationProp),
    }

    if (attrMeta && attrMeta.t === "question") {
      if (isRefAttr(attr.type)) {
        const fieldDef = field.field?.elementField || field.field
        const refSaid = extractRef(attr.type)
        const dep = OCABoxDeps[refSaid]
        const answerAttr = findAttr(attrMeta.answer, dep)
        fieldDef.answer = prepField(answerAttr, attrNameWithNs)
        if (!field.optional) {
          fieldDef.answer.optional = false
        }
        const additionalFields = []
        Object.entries(attrMeta.o || {}).forEach(([option, additionalAttrDef]) => {
          additionalAttrDef.forEach((attrDef) => {
            const attrName = typeof attrDef === "string" ? attrDef : attrDef.an
            const additionalField = prepField(findAttr(attrName, dep), attrNameWithNs)
            if (!conditionals[attrNameWithNs + "." + additionalField.name]) {
              const [head, ...tail] = (attrNameWithNs + "." + answerAttr.name).split(".")
              additionalField.condition = [
                {
                  conditions: {
                    all: [
                      {
                        fact: head,
                        path: tail.join("."),
                        operator: "equal",
                        value: option,
                      },
                    ],
                  },
                  effects: typeof attrDef === "string" ? ["display"] : attrDef.e,
                },
              ]
            }
            additionalFields.push(additionalField)
          })
        })
        if (additionalFields.length > 0) {
          fieldDef.additionalFields = {
            type: "struct",
            name: attrNameWithNs,
            title: "",
            fields: additionalFields,
          }
        }
      }
    }

    for (let lang of presLangs) {
      if (attr.labels?.[lang]) {
        i18n.locales[lang].a[`${attrNameWithNs}.label`] = attr.labels?.[lang]
      }
      if (attr.informations?.[lang]) {
        // TODO information should not be placeholder but hint
        i18n.locales[lang].a[`${attrNameWithNs}.placeholder`] = attr.informations?.[lang]
      }
      if (attr.entries) {
        i18n.locales[lang].a[`${attrNameWithNs}.entries`] = attr.entries?.[lang]
      }
    }

    return field
  }
  const findDep = (/** @type {string} */ attrOCASaid, /** @type {string} */ attrName) => {
    let refSAID = referencedAttrs[attrOCASaid + "." + attrName]
    let dep = OCABoxDeps[refSAID]
    if (!dep) {
      throw new Error(`Referenced bundle ${refSAID} for ${attrName} not found.`)
    }
    return dep
  }

  const mkAggregationPage = (
    /** @type {string} */ attrName,
    /** @type { string[] } */ prefix = [],
  ) => {
    let page = {}
    /** @type { (import("@frontend/common/OcaForm.js").OcaFormPage | import("@frontend/common/OcaForm.js").OcaFieldEntry )[] } */
    page.fields = []
    page.title = `page.${attrName}.title`
    page.name = attrName
    page.type = "struct"

    const attrNameWithNs = prefix.concat(attrName).join(".")
    if (conditionals[attrNameWithNs]) {
      page.condition = conditionals[attrNameWithNs]
    }

    return page
  }

  /** @returns { import("@frontend/common/OcaForm.js").OcaFormPage} */
  const mkNestedRefPage = (
    /** @type {string} */ attrName,
    /** @type { OCABox } */ parent,
    /** @type { string[] } */ prefix = [],
  ) => {
    const page = mkAggregationPage(attrName, prefix)
    let attribute = parent.attributes().find((attr) => attr.name === attrName)
    if (!attribute) {
      throw new Error(
        `Attribute "${attrName}" not found in OCA bundle ${JSON.stringify(parent.meta())}.`,
      )
    }
    for (let lang of presLangs) {
      if (!attribute.labels) {
        console.warn(`No labels found for attribute "${attrName}".`)
      }
      let lbl = attribute.labels?.[lang]
      if (!lbl) {
        console.warn(`No label found for attribute "${attrName}" in language "${lang}".`)
        continue
      }
      i18n.locales[lang].p[page.title] = lbl
    }

    return page
  }
  const pageToFields = (
    /** @type {import("#app/schemas/presentation.js").PageSchemaInterface} */ page,
    /** @type {OCABox} */ ocaBox,
    /** @type {import("@frontend/common/OcaForm.js").OcaFormPage} */ ocaFormPage,
    /** @type { string[] } */ prefix = [],
  ) => {
    /** @type { (import("@frontend/common/OcaForm.js").OcaFormPage | import("@frontend/common/OcaForm.js").OcaFieldEntry )[] } */
    let fields = []
    for (let pageAttr of page.ao) {
      /** @type { import("oca.js").IAttribute | null} */
      let attr = null
      if (typeof pageAttr === "string") {
        attr = findAttr(pageAttr, ocaBox)
        fields.push(prepField(attr, prefix.join(".")))
      } else if ("ao" in pageAttr) {
        if ("n" in pageAttr && ("nr" in pageAttr || "ns" in pageAttr)) {
          if ("nr" in pageAttr && "ns" in pageAttr) {
            throw new Error(`Page cannot have 'nr' and 'ns' attributes at the same time.`)
          }
          throw new Error(`Page cannot have 'n' and 'nr' or 'ns' attributes at the same time.`)
        }
        const ocaSaid = ocaBox.generateBundle().d
        let refOrPageName = null
        if ("n" in pageAttr) {
          refOrPageName = pageAttr.n
          console.warn(
            `[DEPRECATED] Attribute 'n' for page '${pageAttr.n}' is DEPRECATED. Use 'nr' or 'ns' instead.`,
          )
        } else if ("nr" in pageAttr || "ns" in pageAttr) {
          refOrPageName = pageAttr.nr || pageAttr.ns
        }

        let nestedPage = null
        if ("nr" in pageAttr || /* deprecated */ "n" in pageAttr) {
          nestedPage = mkNestedRefPage(refOrPageName, ocaBox, prefix)
          attr = findAttr(refOrPageName, ocaBox)
          refOrPageName = pageAttr.nr || pageAttr.n
          const dep = findDep(ocaSaid, refOrPageName)

          if (Array.isArray(attr.type)) {
            const arrPresData = interaction?.a?.[prefix.concat(refOrPageName).join(".")]
            const additionalFields = []
            if (arrPresData?.t === "list" && arrPresData?.id) {
              if (
                !arrPresData?.idt &&
                (arrPresData?.idt !== "uuid" || arrPresData?.idt !== "bigint")
              ) {
                throw new Error(
                  `List field '${refOrPageName}' has no idt property. Possible values are: 'uuid','bigint'`,
                )
              }

              let current = meta
              prefix.forEach((key, idx) => {
                if (!current[key]) {
                  current[key] = {}
                }
                if (idx === prefix.length - 1) {
                  if (!current[key][refOrPageName]) {
                    current[key][refOrPageName] = {}
                  }
                  current[key][refOrPageName]["_id"] = {
                    id: arrPresData.id,
                    format: arrPresData.idt,
                  }
                }
                current = current[key]
              })
              if (prefix.length === 0) {
                if (!meta[refOrPageName]) meta[refOrPageName] = {}
                meta[refOrPageName]["_id"] = { id: arrPresData.id, format: arrPresData.idt }
              }
              let hf = {
                field: {
                  type: "hidden",
                  format: arrPresData.idt,
                  onItemRemove: arrPresData.on_item_remove,
                },
                name: "_id",
              }
              additionalFields.push(hf)
            }
            pageToFields(pageAttr, dep, nestedPage, prefix.concat(refOrPageName))

            const [min, max] = detectCardinality(attr.cardinality)
            /** @type { import("@frontend/common/OcaForm.js").OcaListField } */
            let f = {
              type: "list",
              minLength: min && min.trim().length > 0 ? parseInt(min) : null,
              maxLength: max && max.trim().length > 0 ? parseInt(max) : null,
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              elementFields: nestedPage.fields.concat(additionalFields),
            }
            nestedPage.fields = [f]
            fields.push(nestedPage)
            continue
          }

          pageToFields(pageAttr, dep, nestedPage, prefix.concat(refOrPageName))
        } else if ("ns" in pageAttr) {
          nestedPage = mkAggregationPage(refOrPageName)
          for (let lang of presLangs) {
            i18n.locales[lang].p[nestedPage.title] = presentation.pl[lang][pageAttr.ns]
          }
          pageToFields(pageAttr, ocaBox, nestedPage, prefix.concat(refOrPageName))
        }

        fields.push(nestedPage)
      } else {
        console.log("Invalid attribute definition", pageAttr)
        continue
      }
    }

    ocaFormPage.fields = fields
  }

  for (let pageLbl of presentation.po) {
    let foundPage = presentation.p.find(
      (page) => page.n === pageLbl || page.ns === pageLbl || page.nr === pageLbl,
    )
    if (!foundPage) {
      console.warn(`No attributes found for page "${pageLbl}".`)
      continue
    }

    /** @type {import("@frontend/common/OcaForm.js").OcaFormPage} */
    let page = {}
    page.type = "page"
    page.name = pageLbl
    page.title = pageLbl
    page.fields = []

    for (let lang of presLangs) {
      if (!presentation.pl[lang]) {
        console.error(
          `No presentation labels found for language "${lang} in presentation d: '${presentation.d}'".`,
        )
        continue
      }
      i18n.locales[lang].p[pageLbl] = presentation.pl[lang][pageLbl]
    }

    pageToFields(foundPage, oca_box, page)
    pages.push(page)
  }

  for (let locale of Object.keys(i18n.locales)) {
    i18n.locales[locale].m["name"] = oca_box.meta()?.[locale]?.name || "—"
    if (oca_box.meta()?.[locale]?.description) {
      i18n.locales[locale].m["description"] = oca_box.meta()?.[locale]?.description
    }
  }
  /** @type { import("@frontend/common/OcaForm.js").OcaForm } */
  let form = { pages }
  return { form, i18n, meta }
}
